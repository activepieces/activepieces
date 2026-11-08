import { t } from 'i18next';
import { useState } from 'react';

import { ImageDialog } from '@/features/chat/chat-message/image-dialog';
import { cn } from '@/lib/utils';

export function ChatImage({ src, alt, className }: ChatImageProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('Open image')}
        className={cn(
          'block w-full cursor-zoom-in overflow-hidden rounded-lg border border-gray-5 bg-gray-2 outline-none focus-visible:ring-2 focus-visible:ring-gray-8',
          className,
        )}
      >
        <img
          src={src}
          alt={alt}
          className="h-auto max-h-96 w-full object-contain"
        />
      </button>
      <ImageDialog open={open} onOpenChange={setOpen} imageUrl={src} />
    </>
  );
}

type ChatImageProps = {
  src: string;
  alt: string;
  className?: string;
};
