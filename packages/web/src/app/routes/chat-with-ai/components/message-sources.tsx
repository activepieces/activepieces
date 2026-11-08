import { t } from 'i18next';
import { FileText } from 'lucide-react';
import { useState } from 'react';

import { Source } from '@/components/prompt-kit/source';

import { SourceItem } from '../lib/message-blocks';

export function MessageSources({ sources }: { sources: SourceItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = sources.filter((source) => source.href || source.title);
  if (visible.length === 0) return null;
  const shown = showAll ? visible : visible.slice(0, MAX_VISIBLE);
  const hiddenCount = visible.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      <span className="text-xs text-gray-11">{t('Sources')}</span>
      {shown.map((source) =>
        source.href ? (
          <Source
            key={source.key}
            href={source.href}
            title={source.title}
            className={CHIP_CLASS}
          />
        ) : (
          <span key={source.key} className={CHIP_CLASS}>
            <FileText className="size-3.5 shrink-0 text-gray-11" />
            <span className="max-w-48 truncate text-gray-12">
              {source.title}
            </span>
          </span>
        ),
      )}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="h-6 rounded-md border border-gray-6 bg-panel px-2 text-xs text-gray-11 outline-none transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8"
        >
          {t('+{count} more', { count: hiddenCount })}
        </button>
      )}
    </div>
  );
}

const MAX_VISIBLE = 3;

const CHIP_CLASS =
  'inline-flex h-6 items-center gap-1.5 rounded-md border border-gray-6 bg-panel px-2 py-0 text-xs text-gray-12 hover:bg-gray-3';
