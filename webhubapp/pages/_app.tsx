import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import DarkModeToggle from '../components/DarkModeToggle';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Magic link: gem session fra URL hvis tokens findes
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.search).then(({ error }) => {
        if (error) {
          console.error('Fejl ved exchangeCodeForSession:', error.message);
        } else {
          console.log('Session hentet fra URL');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      // Fix: Use underscore for unused 'event' parameter
      if (session?.user) {
        const { user } = session;

        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingUser) {
          const { error } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            role: 'student',
          });

          if (error) {
            console.error('Fejl ved oprettelse af bruger:', error.message);
          }
        }

        if (router.pathname === '/login') {
          router.push('/');
        }
      }
    });

    // Don't forget to cleanup the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <>
      <Component {...pageProps} />
      <DarkModeToggle />
    </>
  );
}

export default MyApp;
