import { t } from 'i18next';
import { AppWindow } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
  useOpenInNewTabAction,
} from './preview-card';
import {
  PreviewCodeBody,
  PreviewCodeTab,
  PreviewCodeTabs,
  PreviewWell,
} from './preview-code-tabs';

export function HtmlFrame({ html, className }: HtmlFrameProps) {
  const stableHtml = useDebouncedValue({ value: html, delayMs: 250 });
  return (
    <iframe
      title={t('HTML preview')}
      sandbox=""
      srcDoc={stableHtml}
      className={cn('h-[360px] w-full border-0 bg-white', className)}
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
  const [tab, setTab] = useState<PreviewCodeTab>('preview');
  const openAction = useOpenInNewTabAction({
    content: html,
    mimeType: 'text/html',
  });
  const copyAction = useCopyAction(html);
  const downloadAction = buildDownloadAction({
    fileName,
    content: html,
    mimeType: 'text/html',
    extension: 'html',
  });

  return (
    <PreviewCard
      icon={AppWindow}
      label={label ?? t('HTML page')}
      meta={label ? t('HTML page') : undefined}
      actions={[openAction, copyAction, downloadAction]}
      switcher={<PreviewCodeTabs value={tab} onValueChange={setTab} />}
      renderExpanded={() => <HtmlFrame html={html} className="h-full" />}
    >
      {tab === 'preview' ? (
        <PreviewWell>
          <HtmlFrame html={html} className="rounded-lg border border-gray-5" />
        </PreviewWell>
      ) : (
        <PreviewCodeBody code={html} language="html" />
      )}
    </PreviewCard>
  );
}

function useDebouncedValue<T>({
  value,
  delayMs,
}: {
  value: T;
  delayMs: number;
}): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

type HtmlFrameProps = {
  html: string;
  className?: string;
};
