import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy, Download } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';

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
  const { mutate: copyToClipboard, isPending } = useMutation({
    mutationFn: async () => {
      await navigator.clipboard.writeText(textToCopy);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onError: () => {
      toast({
        title: t('Failed to copy to clipboard'),
        duration: 3000,
      });
    },
  });

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
    <div className=" flex gap-2 items-center bg-background border border-solid text-sm rounded-lg block w-full select-none pr-3">
      {useInput ? (
        <Input
          value={textToCopy}
          className={noBorderInputClass}
          readOnly
        ></Input>
      ) : (
        <Textarea
          value={textToCopy}
          rows={6}
          className={noBorderInputClass}
          readOnly
        ></Textarea>
      )}
      <div className="flex flex-col gap-1">
        <SelectUtilButton
          tooltipText={isPending ? t('Copied') : t('Copy')}
          Icon={isPending ? Check : Copy}
          onClick={() => copyToClipboard()}
        ></SelectUtilButton>
        {fileName && (
          <SelectUtilButton
            tooltipText={t('Download')}
            Icon={Download}
            onClick={() => downloadFile()}
          ></SelectUtilButton>
        )}
      </div>
    </div>
  );
};

CopyToClipboardInput.displayName = 'CopyToClipboardInput';
export { CopyToClipboardInput };
