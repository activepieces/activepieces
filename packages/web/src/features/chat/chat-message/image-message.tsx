import { Download } from 'lucide-react';
import React from 'react';

import ImageWithFallback from '@/components/custom/image-with-fallback';

import { downloadImage } from './download-image';

interface ImageMessageProps {
  content: string;
  setSelectedImage: (image: string | null) => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  content,
  setSelectedImage,
}) => {
  return (
    <div className="w-fit">
      <div className="relative group">
        <ImageWithFallback
          src={content}
          alt="Received image"
          className="w-80 h-auto rounded-md cursor-pointer"
          onClick={() => setSelectedImage(content)}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadImage(content);
          }}
          className="absolute top-2 right-2 bg-scrim rounded-full p-1 hover:bg-scrim/80 transition-opacity opacity-0 group-hover:opacity-100"
        >
          <Download className="h-4 w-4 text-on-inverse" />
        </button>
      </div>
    </div>
  );
};
