import { t } from 'i18next';
import { Code2 } from 'lucide-react';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';
import { PreviewCodeBody } from './preview-code-tabs';
import { previewUtils } from './preview-utils';

export function CodeFilePreview({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const copyAction = useCopyAction(code);
  const downloadAction = buildDownloadAction({
    fileName: 'snippet',
    content: code,
    mimeType: 'text/plain',
    extension: previewUtils.languageToExtension(language),
  });
  const count = code.split('\n').length;
  const hasLanguage = language !== '' && language !== 'plaintext';
  const meta = hasLanguage
    ? t('{language} · {count, plural, =1 {1 line} other {# lines}}', {
        language,
        count,
      })
    : t('{count, plural, =1 {1 line} other {# lines}}', { count });

  return (
    <PreviewCard
      icon={Code2}
      label={t('Code')}
      meta={meta}
      actions={[copyAction, downloadAction]}
    >
      <PreviewCodeBody code={code} language={language} />
    </PreviewCard>
  );
}
