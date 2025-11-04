import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { DownloadButton } from '../download-button';

import { CopyButton } from './copy-button';

type CopyToClipboardInputProps = {
  textToCopy: string;
  useInput: boolean;
  fileName?: string;
};

const noBorderInputClass = `border-none w-full rfocus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0`;

const CopyToClipboardInput = ({
  textToCopy,
  fileName,
  useInput,
}: CopyToClipboardInputProps) => {
  return (
    <div className="flex gap-2 items-center bg-background border border-solid text-sm rounded block w-full select-none pr-3">
      {useInput ? (
        <Input value={textToCopy} className={noBorderInputClass} readOnly />
      ) : (
        <Textarea
          value={textToCopy}
          rows={6}
          className={noBorderInputClass}
          readOnly
        />
      )}
      <div
        className={cn('flex  gap-1', {
          'flex-col': !useInput,
        })}
      >
        <CopyButton textToCopy={textToCopy} variant="ghost" />
        {fileName && (
          <DownloadButton
            textToDownload={textToCopy}
            fileName={fileName}
            variant="ghost"
            tooltipSide="bottom"
          />
        )}
      </div>
    </div>
  );
};

CopyToClipboardInput.displayName = 'CopyToClipboardInput';
export { CopyToClipboardInput };
