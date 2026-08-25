import { t } from 'i18next';
import { Code2, Eye, Image } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { CodeBlockCode } from '@/components/prompt-kit/code-block';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PreviewCard } from './preview-card';

function wrapSvg(svg: string): string {
  return `<!doctype html><html><head><style>html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}svg{max-width:100%;max-height:100%;height:auto}</style></head><body>${svg}</body></html>`;
}

function SvgFrame({ svg, className }: { svg: string; className?: string }) {
  const doc = useMemo(() => wrapSvg(svg), [svg]);
  return (
    <iframe
      title={t('SVG preview')}
      sandbox=""
      srcDoc={doc}
      className={className ?? 'h-[320px] w-full border-0 bg-white'}
    />
  );
}

export function SvgPreview({ svg }: { svg: string }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  const actions = (
    <>
      <CopyButton textToCopy={svg} variant="ghost" className="size-8" />
      <DownloadButton
        fileName="image"
        textToDownload={svg}
        mimeType="image/svg+xml"
        extension="svg"
        variant="ghost"
        className="size-8"
      />
    </>
  );

  return (
    <PreviewCard
      icon={Image}
      label={t('SVG')}
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
        <SvgFrame svg={svg} className="h-full w-full border-0 bg-white" />
      )}
    >
      {tab === 'preview' ? (
        <SvgFrame svg={svg} />
      ) : (
        <CodeBlockCode code={svg} language="xml" className="max-h-[320px]" />
      )}
    </PreviewCard>
  );
}
