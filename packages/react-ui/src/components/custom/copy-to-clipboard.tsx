import { t } from 'i18next';
import { Download } from 'lucide-react';

import { CopyButton } from '../ui/copy-button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

import { SelectUtilButton } from './select-util-button';

type CopyToClipboardInputProps = {
  textToCopy: string;
  useInput: boolean;
  fileName?: string;
};

const noBorderInputClass = `border-none w-full focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0`;

const CopyToClipboardInput = ({
  textToCopy,
  fileName,
  useInput,
}: CopyToClipboardInputProps) => {
  const downloadFile = () => {
    const blob = new Blob([textToCopy], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 items-center bg-background border border-solid text-sm rounded-lg block w-full select-none pr-3">
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
        <CopyButton textToCopy={textToCopy} />
        {fileName && (
          <SelectUtilButton
            tooltipText={t('Download')}
            Icon={Download}
            onClick={() => downloadFile()}
          />
        )}
      </div>
    </div>
  );
};

CopyToClipboardInput.displayName = 'CopyToClipboardInput';
export { CopyToClipboardInput };
