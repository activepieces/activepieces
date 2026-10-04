import { t } from 'i18next';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

export function CodeSnippet({
  code,
  label,
  variant = 'code',
  copyable = true,
  className,
}: CodeSnippetProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-xl border bg-gray-2 text-gray-12',
        className,
      )}
    >
      {label !== undefined && (
        <div className="flex min-h-9 items-center gap-2 border-b py-1 pr-1 pl-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-11">
            {label}
          </span>
          {copyable && (
            <CopyButton textToCopy={code} variant="ghost" size="xs">
              {t('Copy')}
            </CopyButton>
          )}
        </div>
      )}
      <div className="flex min-w-0 items-start gap-2 p-3">
        {variant === 'command' && (
          <span
            aria-hidden
            className="shrink-0 font-mono text-sm text-gray-9 select-none"
          >
            $
          </span>
        )}
        <pre
          className={cn(
            'min-w-0 flex-1 font-mono',
            variant === 'code'
              ? 'max-h-96 overflow-auto text-xs break-words whitespace-pre-wrap'
              : 'text-sm break-all whitespace-pre-wrap',
          )}
        >
          {code}
        </pre>
        {label === undefined && copyable && (
          <CopyButton
            textToCopy={code}
            variant="ghost"
            size="icon-xs"
            aria-label={t('Copy')}
            className="shrink-0"
          />
        )}
      </div>
    </div>
  );
}

type CodeSnippetProps = {
  code: string;
  label?: string;
  variant?: 'command' | 'code' | 'value';
  copyable?: boolean;
  className?: string;
};
