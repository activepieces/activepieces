import { t } from 'i18next';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type DataDisplayTabsProps = {
  data: unknown;
  title: string;
  className?: string;
  copyableData?: unknown;
  downloadFileName?: string;
};

const DataDisplayTabs = ({
  data,
  title,
  className,
  copyableData,
  downloadFileName = 'data',
}: DataDisplayTabsProps) => {
  const canActOnData = copyableData !== undefined && copyableData !== null;

  const handleCopy = () => {
    if (!canActOnData) return;
    navigator.clipboard.writeText(
      typeof copyableData === 'string'
        ? copyableData
        : JSON.stringify(copyableData, null, 2),
    );
    toast.success(t('Copied to clipboard'), { duration: 1000 });
  };

  const handleDownload = () => {
    if (!canActOnData) return;
    const isPlainString = typeof copyableData === 'string';
    const text = isPlainString
      ? copyableData
      : JSON.stringify(copyableData, null, 2);
    const mimeType = isPlainString ? 'text/plain' : 'application/json';
    const extension = isPlainString ? 'txt' : 'json';
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${downloadFileName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('group relative flex flex-col gap-2', className)}>
      {canActOnData && (
        <TooltipProvider>
          <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0"
                  onClick={handleCopy}
                  aria-label={t('Copy to clipboard')}
                >
                  <Copy className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Copy to clipboard')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0"
                  onClick={handleDownload}
                  aria-label={t('Download JSON')}
                >
                  <Download className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Download JSON')}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}
      <JsonViewer
        json={data}
        title={title}
        hideHeader
        hideDownload
        className="border border-solid border-dividers rounded-md"
      />
    </div>
  );
};

DataDisplayTabs.displayName = 'DataDisplayTabs';
export { DataDisplayTabs };
