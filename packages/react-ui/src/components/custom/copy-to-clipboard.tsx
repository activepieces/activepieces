import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';

type CopyToClipboardInputProps = {
  textToCopy: string;
};

const CopyToClipboardInput = ({ textToCopy }: CopyToClipboardInputProps) => {
  const { mutate: copyToClipboard, isPending } = useMutation({
    mutationFn: async (text: string) => {
      await navigator.clipboard.writeText(text);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onError: () => {
      toast({
        title: t('Failed to copy to clipboard'),
        duration: 3000,
      });
    },
  });

  return (
    <div className="relative py-2 w-full">
      <input
        type="text"
        className="col-span-6 bg-background border border-solid text-sm rounded-lg block w-full p-2.5"
        value={textToCopy}
        disabled
      />
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background rounded-lg p-2 inline-flex items-center justify-center"
        onClick={() => copyToClipboard(textToCopy)}
      >
        {isPending ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

CopyToClipboardInput.displayName = 'CopyToClipboardInput';
export { CopyToClipboardInput };
