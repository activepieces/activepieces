import { ImageGeneratedEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ImageDialog } from '@/features/chat/chat-message/image-dialog';

export function GeneratedImageCard({ image }: { image: ImageGeneratedEvent }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const caption = image.caption ?? image.prompt ?? t('Generated image');

  return (
    <>
      <motion.div
        className="max-w-md overflow-hidden rounded-xl border bg-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="block w-full cursor-pointer"
        >
          <img src={image.url} alt={caption} className="h-auto w-full" />
        </button>
        <div className="flex items-center justify-between gap-2 p-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {caption}
          </p>
          <a href={image.url} download target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon-sm">
              <Download className="size-4" />
            </Button>
          </a>
        </div>
      </motion.div>
      <ImageDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageUrl={image.url}
      />
    </>
  );
}
