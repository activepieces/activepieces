import { t } from 'i18next';
import { FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { Markdown } from '@/components/prompt-kit/markdown';

import { PreviewCard } from './preview-card';

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

  const actions = (
    <>
      <CopyButton textToCopy={markdown} variant="ghost" size="icon-sm" />
      <DownloadButton
        fileName={fileName}
        textToDownload={markdown}
        mimeType="text/markdown"
        extension="md"
        variant="ghost"
        size="icon-sm"
      />
    </>
  );

  return (
    <PreviewCard
      icon={FileText}
      label={label ?? t('Document')}
      actions={actions}
      renderExpanded={
        streaming
          ? undefined
          : () => (
              <div className="px-4 py-2 text-sm">
                <Markdown>{markdown}</Markdown>
              </div>
            )
      }
    >
      <div
        ref={scrollRef}
        className="max-h-[420px] overflow-auto px-4 py-2 text-sm"
      >
        <Markdown isAnimating={streaming}>{markdown}</Markdown>
      </div>
    </PreviewCard>
  );
}
