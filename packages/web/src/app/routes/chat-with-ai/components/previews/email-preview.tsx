import { t } from 'i18next';
import { Mail } from 'lucide-react';
import { useMemo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { Markdown } from '@/components/prompt-kit/markdown';
import { cn } from '@/lib/utils';

import { PreviewCard } from './preview-card';

export function parseEmail(content: string): { subject: string; body: string } {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length && i < 5; i++) {
    const match = lines[i].match(
      /^\s*(?:\*\*)?\s*subject\s*(?:\*\*)?\s*:\s*(.+?)\s*$/i,
    );
    if (match) {
      const subject = match[1].replace(/\*\*/g, '').trim();
      const body = lines
        .slice(i + 1)
        .join('\n')
        .trim();
      return { subject, body };
    }
  }
  return { subject: '', body: content.trim() };
}

export function EmailPreview({
  content,
  label,
  fileName = 'email',
  streaming = false,
}: {
  content: string;
  label?: string;
  fileName?: string;
  streaming?: boolean;
}) {
  const { subject, body } = useMemo(() => parseEmail(content), [content]);

  const actions = (
    <>
      <CopyButton textToCopy={content} variant="ghost" className="size-8" />
      <DownloadButton
        fileName={fileName}
        textToDownload={content}
        mimeType="text/plain"
        extension="txt"
        variant="ghost"
        className="size-8"
      />
    </>
  );

  const emailBody = (
    <div className="px-4 py-3">
      {subject && (
        <div className="mb-3 border-b border-border pb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('Subject')}
          </span>
          <p className="mt-0.5 text-sm font-semibold">{subject}</p>
        </div>
      )}
      <div className="text-sm">
        <Markdown isAnimating={streaming}>{body}</Markdown>
      </div>
    </div>
  );

  return (
    <PreviewCard
      icon={Mail}
      label={label ?? t('Email')}
      actions={actions}
      renderExpanded={streaming ? undefined : () => emailBody}
    >
      <div className={cn(!streaming && 'max-h-[420px] overflow-auto')}>
        {emailBody}
      </div>
    </PreviewCard>
  );
}
