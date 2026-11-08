import { t } from 'i18next';
import { Image } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';
import {
  PreviewCodeBody,
  PreviewCodeTab,
  PreviewCodeTabs,
  PreviewWell,
} from './preview-code-tabs';

export function SvgPreview({ svg }: { svg: string }) {
  const [tab, setTab] = useState<PreviewCodeTab>('preview');
  const copyAction = useCopyAction(svg);
  const downloadAction = buildDownloadAction({
    fileName: 'image',
    content: svg,
    mimeType: 'image/svg+xml',
    extension: 'svg',
  });

  return (
    <PreviewCard
      icon={Image}
      label={t('SVG image')}
      actions={[copyAction, downloadAction]}
      switcher={<PreviewCodeTabs value={tab} onValueChange={setTab} />}
      renderExpanded={() => <SvgFrame svg={svg} className="h-full" />}
    >
      {tab === 'preview' ? (
        <PreviewWell>
          <SvgFrame svg={svg} className="rounded-lg border border-gray-5" />
        </PreviewWell>
      ) : (
        <PreviewCodeBody code={svg} language="xml" />
      )}
    </PreviewCard>
  );
}

function SvgFrame({ svg, className }: { svg: string; className?: string }) {
  const doc = useMemo(() => wrapSvg(svg), [svg]);
  return (
    <iframe
      title={t('SVG preview')}
      sandbox=""
      srcDoc={doc}
      className={cn('h-[320px] w-full border-0 bg-white', className)}
    />
  );
}

function wrapSvg(svg: string): string {
  return `<!doctype html><html><head><style>html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}svg{max-width:100%;max-height:100%;height:auto}</style></head><body>${svg}</body></html>`;
}
