import { t } from 'i18next';
import { Braces } from 'lucide-react';
import { useMemo } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';

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
  const copyAction = useCopyAction(pretty);
  const downloadAction = buildDownloadAction({
    fileName,
    content: pretty,
    mimeType: 'application/json',
    extension: 'json',
  });

  return (
    <PreviewCard
      icon={Braces}
      label={label ?? t('JSON')}
      meta={jsonMeta(data)}
      actions={[copyAction, downloadAction]}
      renderExpanded={() => (
        <div className="px-3 py-2">
          <SimpleJsonViewer data={data} hideCopyButton maxHeight={10000} />
        </div>
      )}
    >
      <div className="bg-gray-2 px-3 py-2">
        <SimpleJsonViewer data={data} hideCopyButton maxHeight={360} />
      </div>
    </PreviewCard>
  );
}

function jsonMeta(data: unknown): string | undefined {
  if (Array.isArray(data)) {
    return t('{count, plural, =1 {1 item} other {# items}}', {
      count: data.length,
    });
  }
  if (typeof data === 'object' && data !== null) {
    return t('{count, plural, =1 {1 field} other {# fields}}', {
      count: Object.keys(data).length,
    });
  }
  return undefined;
}
