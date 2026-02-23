import Link from 'next/link';

export default function AllianceNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Alliance Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The alliance you're looking for doesn't exist or is no longer in the Top 3.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to All Alliances
        </Link>
      </div>
    </div>
  );
}
