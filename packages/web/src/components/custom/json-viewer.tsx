import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Copy, Download } from 'lucide-react';
import React, { useMemo } from 'react';
import ReactJson from 'react-json-view';
import { toast } from 'sonner';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type JsonViewerProps = {
  json: any;
  title: React.ReactNode;
  hideDownload?: boolean;
  hideHeader?: boolean;
  className?: string;
};

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefined(value)]),
    );
  }
  return obj;
};

const JsonViewer = React.memo(
  ({
    json: unclearJson,
    title,
    hideDownload = false,
    hideHeader = false,
    className,
  }: JsonViewerProps) => {
    const { theme } = useTheme();
    const json = useMemo(() => {
      return removeUndefined(unclearJson);
    }, [unclearJson]);

    const viewerTheme = theme === 'dark' ? 'bright' : 'rjv-default';
    const handleCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      toast.success(t('Copied to clipboard'), {
        duration: 1000,
      });
    };

    const handleDownload = () => {
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      handleDownloadFile(url);
    };

    const handleDownloadFile = (fileUrl: string, ext = '') => {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${typeof title === 'string' ? title : 'data'}${ext}`;
      link.click();
      URL.revokeObjectURL(fileUrl);
    };
    return (
      <div
        className={cn(
          'rounded-lg border border-solid border-dividers overflow-hidden relative',
          className,
        )}
      >
        {!hideHeader && (
          <div className="px-3 py-2 flex border-solid border-b border-dividers justify-center items-center">
            <div className="grow justify-center items-center">
              <span className="text-md">{title}</span>
            </div>
            <div className="flex items-center gap-0">
              {!hideDownload && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={'ghost'}
                        size={'sm'}
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Download JSON')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={'ghost'} size={'sm'} onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Copy to clipboard')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {
          <>
            {isNil(json) ? (
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto p-2">
                {json === null ? 'null' : 'undefined'}
              </pre>
            ) : (
              <>
                {typeof json !== 'string' && typeof json !== 'object' && (
                  <pre className="text-sm whitespace-pre-wrap  break-all overflow-x-auto p-2">
                    {JSON.stringify(json)}
                  </pre>
                )}
                {typeof json === 'string' && (
                  <pre className="text-sm whitespace-pre-wrap break-all overflow-x-auto p-2">
                    {json}
                  </pre>
                )}
                {typeof json === 'object' && (
                  <div className="max-w-full">
                    <ReactJson
                      style={{
                        overflowX: 'auto',
                        padding: '0.5rem',
                        wordBreak: 'break-word',
                      }}
                      theme={viewerTheme}
                      enableClipboard={false}
                      groupArraysAfterLength={20}
                      displayDataTypes={false}
                      name={false}
                      quotesOnKeys={false}
                      src={json}
                    />
                  </div>
                )}
              </>
            )}
          </>
        }
      </div>
    );
  },
);

JsonViewer.displayName = 'JsonViewer';
export { JsonViewer };
