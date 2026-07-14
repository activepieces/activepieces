import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from '@/components/prompt-kit/code-block';

import { previewUtils } from './preview-utils';

export function CodeFilePreview({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  return (
    <CodeBlock className="my-3">
      <CodeBlockGroup className="border-b px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {language !== 'plaintext' ? language : ''}
        </span>
        <div className="flex items-center gap-0.5">
          <CopyButton
            textToCopy={code}
            withoutTooltip
            variant="ghost"
            className="h-6 w-6 p-0"
          />
          <DownloadButton
            fileName="snippet"
            textToDownload={code}
            extension={previewUtils.languageToExtension(language)}
            variant="ghost"
            className="h-6 w-6 p-0"
          />
        </div>
      </CodeBlockGroup>
      <CodeBlockCode code={code} language={language} />
    </CodeBlock>
  );
}
