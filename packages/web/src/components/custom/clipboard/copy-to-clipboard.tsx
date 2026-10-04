import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { DownloadButton } from '../download-button';

import { CopyButton } from './copy-button';

type CopyToClipboardInputProps = {
  textToCopy: string;
  useInput: boolean;
  fileName?: string;
  masked?: boolean;
};

const noBorderInputClass = `w-full border-none shadow-none focus-visible:ring-transparent`;

const CopyToClipboardInput = ({
  textToCopy,
  fileName,
  useInput,
  masked = false,
}: CopyToClipboardInputProps) => {
  const [revealed, setRevealed] = useState(false);
  const hidden = masked && !revealed;
  const shown = hidden ? maskValue(textToCopy) : textToCopy;
  return (
    <div className="flex w-full items-center gap-1 rounded-lg border border-gray-7 bg-gray-1 pr-1 text-sm shadow-xs select-none">
      {useInput ? (
        <Input
          value={shown}
          className={cn(noBorderInputClass, masked && 'font-mono')}
          readOnly
        />
      ) : (
        <Textarea
          value={shown}
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
        {masked && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={hidden ? t('Show') : t('Hide')}
            onClick={() => setRevealed((value) => !value)}
          >
            {hidden ? <Eye /> : <EyeOff />}
          </Button>
        )}
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

function maskValue(value: string): string {
  const visible = value.slice(-4);
  return '•'.repeat(Math.min(Math.max(value.length - 4, 8), 24)) + visible;
}

CopyToClipboardInput.displayName = 'CopyToClipboardInput';
export { CopyToClipboardInput };
