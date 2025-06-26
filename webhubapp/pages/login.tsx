import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      alert('Noget gik galt: ' + error.message);
    } else {
      alert('Tjek din mail for login-link!');
    }
  };
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center">Log ind</h1>
        <form onSubmit={handleLogin} className="space-y-4 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-mail"
            required
            className="w-full p-3 border rounded bg-white dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            Send login-link
          </button>
        </form>
      </div>
    </main>
  );
}
