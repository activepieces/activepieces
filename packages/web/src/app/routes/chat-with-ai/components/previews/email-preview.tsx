import { t } from 'i18next';
import { Mail } from 'lucide-react';
import { useMemo } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';
import { cn } from '@/lib/utils';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';

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
  const copyAction = useCopyAction(content);
  const downloadAction = buildDownloadAction({
    fileName,
    content,
    mimeType: 'text/plain',
    extension: 'txt',
  });

  const emailBody = (
    <div className="text-sm">
      <Markdown isAnimating={streaming}>{body}</Markdown>
    </div>
  );

  return (
    <PreviewCard
      icon={Mail}
      label={subject || label || t('Email')}
      meta={t('Email draft')}
      actions={[copyAction, downloadAction]}
      renderExpanded={
        streaming
          ? undefined
          : () => <div className="px-6 py-4">{emailBody}</div>
      }
    >
      <div
        className={cn(
          'py-3 pl-14 pr-4 @max-chat-narrow/chat:pl-3',
          !streaming && 'max-h-[420px] overflow-auto',
        )}
      >
        {emailBody}
      </div>
    </PreviewCard>
  );
}

function parseEmail(content: string): { subject: string; body: string } {
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
