import { useRouter } from 'next/router';

export default function Landing() {
  const router = useRouter();
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Velkommen til ELCOS StudentHUB</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Log ind for at se kommende events og opslag fra dine tutorer.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Gå til login
        </button>
      </div>
    </main>
  );
}