import { t } from 'i18next';
import { Code2, ExternalLink, FileCode2, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { CodeBlockCode } from '@/components/prompt-kit/code-block';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PreviewCard, PreviewIconButton } from './preview-card';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function HtmlFrame({ html, className }: { html: string; className?: string }) {
  const stableHtml = useDebouncedValue(html, 250);
  return (
    <iframe
      title={t('HTML preview')}
      sandbox=""
      srcDoc={stableHtml}
      className={className ?? 'h-[360px] w-full border-0 bg-white'}
    />
  );
}

export function HtmlPreview({
  html,
  label,
  fileName = 'template',
}: {
  html: string;
  label?: string;
  fileName?: string;
}) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const openInNewTab = () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = new Blob([html], { type: 'text/html' });
    blobUrlRef.current = URL.createObjectURL(blob);
    window.open(blobUrlRef.current, '_blank', 'noopener,noreferrer');
  };

  const actions = (
    <>
      <PreviewIconButton
        icon={ExternalLink}
        label={t('Open in new tab')}
        onClick={openInNewTab}
      />
      <CopyButton textToCopy={html} variant="ghost" className="size-8" />
      <DownloadButton
        fileName={fileName}
        textToDownload={html}
        mimeType="text/html"
        extension="html"
        variant="ghost"
        className="size-8"
      />
    </>
  );

  return (
    <PreviewCard
      icon={FileCode2}
      label={label ?? t('HTML template')}
      actions={actions}
      toolbar={
        <div className="border-b border-border px-3 py-2">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'preview' | 'code')}
          >
            <TabsList className="h-7">
              <TabsTrigger
                value="preview"
                className="gap-1.5 px-2 py-0.5 text-xs"
              >
                <Eye className="size-3.5" />
                {t('Preview')}
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5 px-2 py-0.5 text-xs">
                <Code2 className="size-3.5" />
                {t('Code')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      }
      renderExpanded={() => (
        <HtmlFrame html={html} className="h-full w-full border-0 bg-white" />
      )}
    >
      {tab === 'preview' ? (
        <HtmlFrame html={html} />
      ) : (
        <CodeBlockCode code={html} language="html" className="max-h-[360px]" />
      )}
    </PreviewCard>
  );
}
