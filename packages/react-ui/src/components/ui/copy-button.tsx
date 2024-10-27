import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface CopyButtonProps extends ButtonProps {
  textToCopy: string;
}

export const CopyButton = ({
  textToCopy,
  className,
  ...props
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const { mutate: copyToClipboard } = useMutation({
    mutationFn: async () => {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    },
    onError: () => {
      toast({
        title: t('Failed to copy to clipboard'),
        duration: 3000,
      });
    },
  });

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={() => copyToClipboard()}
      {...props}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};
