import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const handleLogin = async () => {
    const email = prompt('Indtast din e-mail for at logge ind');
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      alert('Noget gik galt: ' + error.message);
    } else {
      alert('Tjek din mail for login-link!');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
      >
        Log ind med e-mail
      </button>
    </main>
  );
}
