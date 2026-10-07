import { t } from 'i18next';
import { BookOpen, ChevronDown, ExternalLink, PlayCircle } from 'lucide-react';
import { RefObject, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { adminLayout } from './admin-layout';

export function AdminResources({ resources }: AdminResourcesProps) {
  const [playing, setPlaying] = useState<AdminResource | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const docs = resources.filter((resource) => resource.kind === 'doc');
  const videos = resources.filter((resource) => resource.kind === 'video');

  const trigger =
    resources.length === 1 ? (
      <SingleResourceButton
        resource={resources[0]}
        buttonRef={triggerRef}
        onPlay={() => setPlaying(resources[0])}
      />
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} type="button" variant="ghost">
            {videos.length > 0 ? <PlayCircle /> : <BookOpen />}
            {videos.length > 0 ? t('Docs and tutorials') : t('Docs')}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {docs.length > 0 && videos.length > 0 && (
            <DropdownMenuLabel>{t('Docs')}</DropdownMenuLabel>
          )}
          {docs.map((doc) => (
            <DropdownMenuItem key={doc.url} asChild>
              <a
                {...adminControl(doc.control)}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen />
                <span className="flex-1 truncate">{doc.label()}</span>
                <ExternalLink className="text-gray-11" />
              </a>
            </DropdownMenuItem>
          ))}
          {docs.length > 0 && videos.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('Tutorials')}</DropdownMenuLabel>
            </>
          )}
          {videos.map((video) => (
            <DropdownMenuItem
              key={video.url}
              onSelect={() => setTimeout(() => setPlaying(video), 0)}
            >
              <PlayCircle />
              <span className="flex-1 truncate">{video.label()}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <>
      {trigger}
      <AdminVideoDialog
        video={playing}
        returnFocusRef={triggerRef}
        onOpenChange={(open) => {
          if (!open) {
            setPlaying(null);
          }
        }}
      />
    </>
  );
}

export function AdminVideoDialog({
  video,
  returnFocusRef,
  onOpenChange,
}: AdminVideoDialogProps) {
  const embed = video === null ? null : toEmbedUrl(video.url);
  return (
    <Dialog open={video !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className={adminLayout.dialog.lg}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{video && video.label()}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('Video tutorial')}
          </DialogDescription>
        </DialogHeader>
        {video && embed && (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-3">
            {embed.kind === 'file' ? (
              <video src={embed.url} controls autoPlay className="size-full" />
            ) : (
              <iframe
                src={embed.url}
                title={video.label()}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            )}
          </div>
        )}
        {video && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-11 hover:underline"
          >
            {t('Open in a new tab')}
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SingleResourceButton({
  resource,
  buttonRef,
  onPlay,
}: {
  resource: AdminResource;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onPlay: () => void;
}) {
  if (resource.kind === 'video') {
    return (
      <Button ref={buttonRef} type="button" variant="ghost" onClick={onPlay}>
        <PlayCircle />
        {resource.label()}
      </Button>
    );
  }
  return (
    <Button variant="ghost" asChild>
      <a
        {...adminControl(resource.control)}
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <BookOpen />
        {resource.label()}
      </a>
    </Button>
  );
}

function toEmbedUrl(
  url: string,
): { kind: 'iframe' | 'file'; url: string } | null {
  const youtube = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/,
  );
  if (youtube) {
    return {
      kind: 'iframe',
      url: `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1`,
    };
  }
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) {
    return {
      kind: 'iframe',
      url: `https://www.loom.com/embed/${loom[1]}?autoplay=1`,
    };
  }
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return { kind: 'file', url };
  }
  return null;
}

export type AdminResource = {
  kind: 'doc' | 'video';
  label: () => string;
  url: string;
  control?: AdminControl;
};

type AdminResourcesProps = {
  resources: AdminResource[];
};

type AdminVideoDialogProps = {
  video: AdminResource | null;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
};
