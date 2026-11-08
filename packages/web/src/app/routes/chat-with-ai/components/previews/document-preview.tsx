import { t } from 'i18next';
import { FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';

export function DocumentPreview({
  markdown,
  label,
  fileName = 'document',
  streaming = false,
}: {
  markdown: string;
  label?: string;
  fileName?: string;
  streaming?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [markdown, streaming]);

  const copyAction = useCopyAction(markdown);
  const downloadAction = buildDownloadAction({
    fileName,
    content: markdown,
    mimeType: 'text/markdown',
    extension: 'md',
  });

  return (
    <PreviewCard
      icon={FileText}
      label={label ?? t('Document')}
      meta={label ? t('Document') : undefined}
      actions={[copyAction, downloadAction]}
      renderExpanded={
        streaming
          ? undefined
          : () => (
              <div className="px-6 py-4 text-sm">
                <Markdown>{markdown}</Markdown>
              </div>
            )
      }
    >
      <div
        ref={scrollRef}
        className="max-h-[420px] overflow-auto py-3 pl-14 pr-4 text-sm @max-chat-narrow/chat:pl-3"
      >
        <Markdown isAnimating={streaming}>{markdown}</Markdown>
      </div>
    </PreviewCard>
  );
}
