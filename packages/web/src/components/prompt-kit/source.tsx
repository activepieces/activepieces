import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

type SourceProps = {
  href: string;
  title?: string;
  className?: string;
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
}

function Source({ href, title, className }: SourceProps) {
  const domain = getDomain(href);
  const favicon = getFaviconUrl(href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted no-underline',
        className,
      )}
    >
      {favicon && (
        <img
          src={favicon}
          alt=""
          className="h-4 w-4 shrink-0 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <span className="flex-1 min-w-0 truncate text-foreground">
        {title || domain}
      </span>
      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
    </a>
  );
}

export { Source };
export type { SourceProps };
