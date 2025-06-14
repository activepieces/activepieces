import { TooltipContentProps } from '@radix-ui/react-tooltip';
import { t } from 'i18next';
import { Download } from 'lucide-react';

import { Button, ButtonProps } from '@/components/ui/button';

import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface DownloadButtonProps extends ButtonProps {
  fileName: string;
  textToDownload: string;
  tooltipSide?: TooltipContentProps['side'];
}

export const DownloadButton = ({
  fileName,
  className,
  textToDownload,
  tooltipSide,
  ...props
}: DownloadButtonProps) => {
  const downloadFile = () => {
    const blob = new Blob([textToDownload], {
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={className}
          onClick={() => downloadFile()}
          {...props}
        >
          <Download className="h-4 w-4"></Download>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{t('Download')}</TooltipContent>
    </Tooltip>
  );
};
