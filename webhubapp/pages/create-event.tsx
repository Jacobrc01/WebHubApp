import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function CreateEventPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (userData?.role === 'tutor') {
        setAllowed(true);
      } else {
        router.push('/');
      }

      setLoading(false);
    };

    checkRole();
  }, [router]);

  // Formular og opret-funktion…
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase.from('events').insert({
      title,
      description,
      start_time: new Date(startTime),
      location,
      created_by: user?.id,
    });

    if (error) setMessage('Fejl: ' + error.message);
    else {
      setMessage('Event oprettet!');
      setTimeout(() => router.push('/'), 2000);
    }
  };
  if (loading) return <p className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">Tjekker tilladelser…</p>;
  if (!allowed) return null;
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 lg:py-10">
      <div className="container-responsive">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold">Opret nyt event</h1>
          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
            <input
              className="w-full p-3 border rounded bg-white dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 text-sm sm:text-base"
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full p-3 border rounded bg-white dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 text-sm sm:text-base min-h-24"
              placeholder="Beskrivelse"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded bg-white dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 text-sm sm:text-base"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <input
              className="w-full p-3 border rounded bg-white dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 text-sm sm:text-base"
              placeholder="Sted"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow text-sm sm:text-base"
            >
              Opret event
            </button>
          </form>
          {message && (
            <p className="text-center text-sm text-blue-600 dark:text-blue-400">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
