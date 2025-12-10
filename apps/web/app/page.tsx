import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Bicyverse</h1>
      <div className="space-y-4">
        <Link href="/users" className="block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 text-center">
          Users Management (API)
        </Link>
        <Link
          href="/userprofile"
          className="block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 text-center"
        >
          UserProfile (Blockchain + Polkadot.js)
        </Link>
      </div>
    </div>
  );
}
