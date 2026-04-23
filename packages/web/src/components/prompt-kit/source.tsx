import { Globe } from 'lucide-react';
import { useState } from 'react';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    if (!origin || origin === 'null') return '';
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function FaviconOrGlobe({ url, size }: { url: string; size: 'sm' | 'md' }) {
  const favicon = getFaviconUrl(url);
  const [failed, setFailed] = useState(false);
  const globeSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const imgSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (!favicon || failed) {
    return (
      <Globe className={cn(globeSize, 'shrink-0 text-muted-foreground')} />
    );
  }

  return (
    <img
      src={favicon}
      alt=""
      className={cn(imgSize, 'shrink-0 rounded-sm')}
      onError={() => setFailed(true)}
    />
  );
}

function Source({ href, title, className }: SourceProps) {
  const domain = getDomain(href);

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs transition-colors hover:bg-muted no-underline',
            className,
          )}
        >
          <FaviconOrGlobe url={href} size="sm" />
          <span className="max-w-[200px] truncate text-foreground/80">
            {domain}
          </span>
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FaviconOrGlobe url={href} size="md" />
            <span className="text-xs text-muted-foreground truncate">
              {domain}
            </span>
          </div>
          {title && (
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {title}
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate">{href}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export { Source };

export type SourceProps = {
  href: string;
  title?: string;
  className?: string;
};
