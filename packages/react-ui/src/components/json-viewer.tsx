import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import React, { useLayoutEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ReactJson from 'react-json-view';

import { Button } from './ui/button';
import { toast } from './ui/use-toast';

import { useTheme } from '@/components/theme-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isStepFileUrl } from '@/lib/utils';

type JsonViewerProps = {
  json: any;
  title: string;
  hideDownload?: boolean;
};

type FileButtonProps = {
  fileUrl: string;
  handleDownloadFile: (fileUrl: string) => void;
};
const FileButton = ({ fileUrl, handleDownloadFile }: FileButtonProps) => {
  const readonly = fileUrl.includes('file://');
  return (
    <div className="flex items-center gap-0">
      <Button
        variant="ghost"
        size="sm"
        disabled={readonly}
        onClick={() => handleDownloadFile(fileUrl)}
        className="flex items-center gap-2 p-2 max-h-[20px] text-xs"
      >
        {readonly ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {t('Download File')}
      </Button>
    </div>
  );
};

const removeDoubleQuotes = (str: string): string =>
  str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str;

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
  ({ json: unclearJson, title, hideDownload = false }: JsonViewerProps) => {
    const { theme } = useTheme();
    const json = useMemo(() => {
      return removeUndefined(unclearJson);
    }, [unclearJson]);

    const viewerTheme = theme === 'dark' ? 'bright' : 'rjv-default';
    const handleCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      toast({
        title: t('Copied to clipboard'),
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
      link.download = `${title}${ext}`;
      link.click();
      URL.revokeObjectURL(fileUrl);
    };
    useLayoutEffect(() => {
      if (typeof json === 'object') {
        const stringValuesHTML = Array.from(
          document.getElementsByClassName('string-value'),
        );

        const stepFileUrlsHTML = stringValuesHTML.filter(
          (el) =>
            isStepFileUrl(el.innerHTML) ||
            isStepFileUrl(el.parentElement!.nextElementSibling?.innerHTML),
        );

        stepFileUrlsHTML.forEach((el: Element) => {
          const fileUrl = removeDoubleQuotes(el.innerHTML)
            .trim()
            .replace('\n', '');
          el.className += ' hidden';

          const rootElem = document.createElement('div');
          const root = createRoot(rootElem);

          el.parentElement!.replaceChildren(el as Node, rootElem as Node);
          const isProductionFile = fileUrl.includes('file://');

          root.render(
            <div data-file-root="true">
              {isProductionFile ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FileButton
                        fileUrl={fileUrl}
                        handleDownloadFile={handleDownloadFile}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {t('File is not available after execution.')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <FileButton
                  fileUrl={fileUrl}
                  handleDownloadFile={handleDownloadFile}
                />
              )}
            </div>,
          );
        });
      }
    });

    if (isStepFileUrl(json)) {
      return (
        <FileButton fileUrl={json} handleDownloadFile={handleDownloadFile} />
      );
    }

    return (
      <div className="rounded-lg border border-solid border-dividers overflow-hidden relative">
        <div className="px-3 py-2 flex border-solid border-b border-dividers justify-center items-center">
          <div className="flex-grow justify-center items-center">
            <span className="text-md">{title}</span>
          </div>
          <div className="flex items-center gap-0">
            {!hideDownload && (
              <Button variant={'ghost'} size={'sm'} onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button variant={'ghost'} size={'sm'} onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
