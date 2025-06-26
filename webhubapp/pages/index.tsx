// pages/index.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Event = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  location: string | null;
};

type RSVP = {
  id: string;
  event_id: string;
  user_id: string;
};

type Message = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  user_email?: string;
};

type MessageWithUsers = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  users: { email: string }[] | null;
};

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [myRsvps, setMyRsvps] = useState<RSVP[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<Message[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Realtime subscriptions - kun hvis bruger er logget ind
  useEffect(() => {
    let eventsChannel: RealtimeChannel | null = null;
    let messagesChannel: RealtimeChannel | null = null;
    let rsvpsChannel: RealtimeChannel | null = null;
      const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Events realtime
      eventsChannel = supabase
        .channel('events-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        }, (payload) => {
          const newEvent = payload.new as Event;
          if (new Date(newEvent.start_time) > new Date()) {
            setEvents(prev => [...prev, newEvent].sort((a, b) => 
              new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            ));
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        }, (payload) => {
          const updatedEvent = payload.new as Event;
          setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        }, (payload) => {
          const deletedEvent = payload.old as Event;
          setEvents(prev => prev.filter(e => e.id !== deletedEvent.id));
        })
        .subscribe();

      // Messages realtime
      messagesChannel = supabase
        .channel('messages-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const newMessage = {
            ...(payload.new as Message),
            user_email: 'Ukendt bruger'
          };
          setPosts(prev => [newMessage, ...prev]);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const deletedMessage = payload.old as Message;
          setPosts(prev => prev.filter(m => m.id !== deletedMessage.id));
        })
        .subscribe();

      // RSVP realtime for at opdatere både counts og myRsvps
      rsvpsChannel = supabase
        .channel('rsvps-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rsvps',
        }, async (payload) => {
          console.log('RSVP change detected:', payload);
          
          // Opdater counts for alle events
          const { data: allRsvps, error: countError } = await supabase
            .from('rsvps')
            .select('event_id');
            if (!countError && allRsvps) {
            const map: Record<string, number> = {};
            allRsvps.forEach((row: { event_id: string }) => {
              map[row.event_id] = (map[row.event_id] || 0) + 1;
            });
            setCounts(map);
          }          // Opdater myRsvps for den aktuelle bruger
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: myUpdatedRsvps, error: myError } = await supabase
              .from('rsvps')
              .select('*')
              .eq('user_id', currentUser.id);
            
            if (!myError && myUpdatedRsvps) {
              setMyRsvps(myUpdatedRsvps);
            }
          }
        })
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (eventsChannel) supabase.removeChannel(eventsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (rsvpsChannel) supabase.removeChannel(rsvpsChannel);
    };
  }, []);

  // 1) Hent session, email og rolle
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();      if (!user) {
        setLoading(false);
        return;
      }
      setUserEmail(user.email || null);

      // Hent rolle
      const { data: u, error: e1 } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (e1) console.error(e1.message);
      else setRole(u.role);

      setLoading(false);
    };
    init();
  }, [router]);

  // 2) Hent events (initial load)
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      if (error) console.error(error.message);
      else setEvents(data || []);
    };
    fetchEvents();
  }, []);

  // 3) Hent dine tilmeldinger
  useEffect(() => {
    const fetchMyRSVPs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('user_id', user.id);
      if (error) console.error(error.message);
      else setMyRsvps(data || []);
    };
    fetchMyRSVPs();
  }, [router]);

  // 4) Hent antal tilmeldte per event
  useEffect(() => {
    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*');
      if (error) console.error(error.message);
      else {
        const map: Record<string, number> = {};
        data?.forEach(r => {
          map[r.event_id] = (map[r.event_id] || 0) + 1;
        });
        setCounts(map);
      }
    };
    fetchCounts();
  }, []);

  // Hent opslag til opslagstavle (initial load)
useEffect(() => {
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        author_id,
        users ( email )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fejl ved hentning af opslag:', error.message);
      return;
    }    setPosts(
      (data || []).map((p: MessageWithUsers) => ({
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        created_at: p.created_at,
        user_email: p.users?.[0]?.email ?? 'Ukendt bruger',
      }))
    );
  };

  fetchPosts();
}, [])



  // Send nyt opslag - fjernet genindlæsning da realtime håndterer det
  const handlePost = async () => {
    if (role !== 'tutor') return alert('Kun tutorer kan skrive opslag.');
    const user = (await supabase.auth.getUser()).data.user!;
    
    const { error: insertError } = await supabase
      .from('messages')
      .insert({ 
        author_id: user.id, 
        content: newPost 
      });
    
    if (insertError) {
      console.error('Fejl ved oprettelse af opslag:', insertError.message);
      return;
    }
    
    setNewPost('');
    // Realtime subscription håndterer opdatering af posts
  };

  // Slet opslag - realtime håndterer opdatering
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) console.error(error.message);
    // Realtime subscription håndterer fjernelse fra posts
  };

  // Slet event - realtime håndterer opdatering
  const handleDeleteEvent = async (id: string) => {
    if (role !== 'tutor') return;
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    if (error) console.error('Fejl ved sletning af event:', error.message);
    // Realtime subscription håndterer fjernelse fra events
  };

  // Toggle RSVP - fjern manuel opdatering
  const toggleRSVP = async (evId: string) => {
    if (role !== 'student') {
      return alert('Kun studerende kan tilmelde sig events.');
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert('Log ind først');

    const existing = myRsvps.find((r) => r.event_id === evId);
    
    try {
      if (existing) {
        const { error } = await supabase.from('rsvps').delete().eq('id', existing.id);
        if (error) console.error('Fejl ved afmelding:', error.message);
      } else {
        const { error } = await supabase
          .from('rsvps')
          .insert({ user_id: user.id, event_id: evId, status: 'going' });
        if (error) console.error('Fejl ved tilmelding:', error.message);
      }
      
      // Fjernet manuel opdatering - realtime subscription håndterer alt
    } catch (error) {
      console.error('Uventet fejl:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <p className="min-h-screen p-6">Henter data…</p>;
  return (
    <main className="min-h-screen w-full">
      <div className="container-responsive py-6 lg:py-8 space-y-8 lg:space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 dark:border-gray-700 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Velkommen til WebHubApp</h1>
          {userEmail ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm sm:text-base">
                <strong>{userEmail}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Log ud
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Log ind
            </button>
          )}
        </header>

        {/* Tutor-knap */}
        {userEmail && role === 'tutor' && (
          <button
            onClick={() => router.push('/create-event')}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow"
          >
            Opret nyt event
          </button>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* Opslagstavle */}
          <section className="space-y-6">
            <h2 className="text-xl lg:text-2xl font-semibold">Opslagstavle</h2>
            {role === 'tutor' && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Skriv nyt opslag…"
                  className="flex-1 p-3 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
                <button
                  onClick={handlePost}
                  className="px-4 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Opret opslag
                </button>
              </div>
            )}
            <div className="space-y-3 max-h-96 lg:max-h-[500px] overflow-y-auto">
              {posts.map(p => (
                <div key={p.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex justify-between bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="break-words">{p.content}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(p.created_at).toLocaleString('da-DK')} — {p.user_email}
                    </div>
                  </div>
                  {role === 'tutor' && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline text-sm ml-4 flex-shrink-0"
                    >
                      Slet
                    </button>
                  )}
                </div>
              ))}
              {posts.length === 0 && <p className="text-gray-500 dark:text-gray-400">Ingen opslag endnu.</p>}
            </div>
          </section>

          {/* Event-feed */}
          <section className="space-y-6">
            <h2 className="text-xl lg:text-2xl font-semibold">Kommende events</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Ingen planlagte events lige nu.</p>
            ) : (
              <div className="space-y-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
                {events.map((ev) => {
                  const going = myRsvps.some((r) => r.event_id === ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="border border-gray-200 dark:border-gray-700 p-4 lg:p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition"
                    >
                      <h3 className="text-lg lg:text-xl font-semibold">{ev.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        🗓️ {new Date(ev.start_time).toLocaleString('da-DK')}
                        {ev.location && ` · 📍 ${ev.location}`}
                      </p>
                      {ev.description && <p className="mt-2 text-sm lg:text-base">{ev.description}</p>}
                      {userEmail && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <button
                            onClick={() => toggleRSVP(ev.id)}
                            className={`px-3 py-1 rounded text-sm ${
                              role !== 'student'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : going
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white`}
                            disabled={role !== 'student'}
                          >
                            {role !== 'student'
                              ? 'Ikke tilladt'
                              : going
                              ? 'Afmeld'
                              : 'Tilmeld'}
                          </button>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {counts[ev.id] ?? 0} tilmeldt
                          </span>
                          {role === 'tutor' && (
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Slet
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
