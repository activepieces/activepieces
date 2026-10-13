import { t } from 'i18next';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

import { SetupBlock } from '../mcp-client-catalog';

export function SetupCodeBlock({ block }: { block: SetupBlock }) {
  const isPrompt = block.kind === 'prompt';
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-gray-2">
      <div className="flex items-center gap-2 border-b py-1.5 pl-3.5 pr-1.5">
        <span className="flex-1 truncate text-xs font-medium text-gray-11">
          {block.label}
        </span>
        <CopyButton
          textToCopy={block.text}
          variant="ghost"
          size="xs"
          className="text-gray-11 hover:text-gray-12"
        >
          {t('Copy')}
        </CopyButton>
      </div>
      <div className="flex min-w-0 items-start gap-2.5 px-3.5 py-3">
        {block.kind === 'terminal' && (
          <span className="shrink-0 font-mono text-xs leading-relaxed text-gray-9">
            $
          </span>
        )}
        <pre
          className={cn(
            'min-w-0 whitespace-pre-wrap text-gray-12',
            isPrompt
              ? 'font-sans text-sm leading-relaxed'
              : 'break-all font-mono text-xs leading-relaxed',
          )}
        >
          {block.text}
        </pre>
      </div>
    </div>
  );
}
