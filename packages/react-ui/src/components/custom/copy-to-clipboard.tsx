import { CopyButton } from '../ui/copy-button';
import { DownloadButton } from '../ui/download-button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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
      <div className="flex flex-col gap-1">
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
