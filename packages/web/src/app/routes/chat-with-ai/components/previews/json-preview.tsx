import { t } from 'i18next';
import { Braces } from 'lucide-react';
import { useMemo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';

import { PreviewCard } from './preview-card';

export function JsonPreview({
  data,
  label,
  fileName = 'data',
}: {
  data: unknown;
  label?: string;
  fileName?: string;
}) {
  const pretty = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const actions = (
    <>
      <CopyButton textToCopy={pretty} variant="ghost" className="size-8" />
      <DownloadButton
        fileName={fileName}
        textToDownload={pretty}
        mimeType="application/json"
        extension="json"
        variant="ghost"
        className="size-8"
      />
    </>
  );

  return (
    <PreviewCard
      icon={Braces}
      label={label ?? t('JSON')}
      actions={actions}
      renderExpanded={() => (
        <div className="px-1">
          <SimpleJsonViewer data={data} hideCopyButton maxHeight={10000} />
        </div>
      )}
    >
      <div className="px-1">
        <SimpleJsonViewer data={data} hideCopyButton maxHeight={360} />
      </div>
    </PreviewCard>
  );
}
