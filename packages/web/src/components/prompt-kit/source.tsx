import { Globe02Icon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { LogoPlate } from '@/components/custom/logo-plate';
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
  const globeSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const imgSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (!favicon) {
    return (
      <HugeiconsIcon
        icon={Globe02Icon}
        className={cn(globeSize, 'shrink-0 text-gray-11')}
      />
    );
  }

  return (
    <LogoPlate
      src={favicon}
      alt=""
      className={cn(imgSize, 'rounded-sm')}
      fallback={<HugeiconsIcon icon={Globe02Icon} className={globeSize} />}
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
            'inline-flex items-center gap-1.5 rounded-full border bg-gray-3/50 px-2.5 py-1 text-xs transition-colors hover:bg-gray-3 no-underline',
            className,
          )}
        >
          <FaviconOrGlobe url={href} size="sm" />
          <span className="max-w-[200px] truncate text-gray-12/80">
            {domain}
          </span>
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FaviconOrGlobe url={href} size="md" />
            <span className="text-xs text-gray-11 truncate">{domain}</span>
          </div>
          {title && (
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {title}
            </p>
          )}
          <p className="text-xs text-gray-11 truncate">{href}</p>
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
