import { t } from 'i18next';
import { FileText, X } from 'lucide-react';
import prettyBytes from 'pretty-bytes';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatFileChip({
  name,
  type,
  size,
  thumbnailUrl,
  onOpen,
  onRemove,
  className,
}: ChatFileChipProps) {
  const meta = [type, size === undefined ? undefined : prettyBytes(size)]
    .filter((part) => part !== undefined && part.length > 0)
    .join(' · ');
  const body = (
    <>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="size-8 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-2 text-gray-11">
          <FileText className="size-4" />
        </span>
      )}
      <span className="flex min-w-0 flex-col text-left">
        <span className="whitespace-nowrap text-xs font-medium text-gray-12">
          {shortenMiddle(name)}
        </span>
        {meta.length > 0 && (
          <span className="whitespace-nowrap text-xs text-gray-11">{meta}</span>
        )}
      </span>
    </>
  );

  return (
    <div
      title={name}
      className={cn(
        'flex h-10 max-w-full items-center gap-1 rounded-lg border border-gray-6 bg-panel',
        onRemove ? 'pr-1' : 'pr-3',
        className,
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={t('Open {name}', { name })}
          className="flex min-w-0 items-center gap-2 rounded-md py-0.5 pl-1 outline-none focus-visible:ring-2 focus-visible:ring-gray-8"
        >
          {body}
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-2 pl-1">{body}</span>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-gray-11"
          onClick={onRemove}
          aria-label={t('Remove {name}', { name })}
        >
          <X />
        </Button>
      )}
    </div>
  );
}

function shortenMiddle(name: string): string {
  if (name.length <= MAX_NAME_LENGTH) return name;
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot) : '';
  const tailLength = Math.max(extension.length + 5, 10);
  const headLength = MAX_NAME_LENGTH - tailLength - 1;
  return `${name.slice(0, headLength)}…${name.slice(-tailLength)}`;
}

const MAX_NAME_LENGTH = 24;

type ChatFileChipProps = {
  name: string;
  type?: string;
  size?: number;
  thumbnailUrl?: string;
  onOpen?: () => void;
  onRemove?: () => void;
  className?: string;
};
