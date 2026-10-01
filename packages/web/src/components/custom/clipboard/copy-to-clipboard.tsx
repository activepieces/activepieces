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

const noBorderInputClass = `w-full border-none shadow-none focus-visible:ring-transparent`;

const CopyToClipboardInput = ({
  textToCopy,
  fileName,
  useInput,
}: CopyToClipboardInputProps) => {
  return (
    <div className="flex w-full items-center gap-1 rounded-lg border border-gray-7 bg-gray-1 pr-1 text-sm shadow-xs select-none">
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
        className={cn('flex gap-1', {
          'flex-col': !useInput,
        })}
      >
        <CopyButton textToCopy={textToCopy} variant="ghost" size="icon-sm" />
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
