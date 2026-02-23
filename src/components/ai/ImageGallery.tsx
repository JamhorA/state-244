import type { AIGeneratedImage } from '@/types';

interface ImageGalleryProps {
  images: AIGeneratedImage[];
  onDownload?: (imageUrl: string, imageType: string) => void;
  onDelete?: (imageId: string) => void;
  loading?: boolean;
}

export function ImageGallery({ images, onDownload, onDelete, loading }: ImageGalleryProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'banner': return 'Banner';
      case 'emblem': return 'Emblem';
      case 'logo_draft': return 'Logo Draft';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg animate-pulse aspect-square" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🖼️</div>
        <p className="text-gray-600">No images generated yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Generate your first alliance image above!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.id} className="relative group">
          {/* Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={image.image_url}
              alt={image.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(image.image_url, image.image_type)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Download"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(image.id)}
                className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                title="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Type badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {getTypeLabel(image.image_type)}
          </div>

          {/* Date */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {new Date(image.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
