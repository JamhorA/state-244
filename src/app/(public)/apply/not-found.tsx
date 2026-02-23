import Link from 'next/link';

export default function ApplyNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Application Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The alliance you're applying to doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Alliances
        </Link>
      </div>
    </div>
  );
}
