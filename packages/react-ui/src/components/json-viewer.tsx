import { t } from 'i18next';
import { Copy, Download, Eye, EyeOff, File } from 'lucide-react';
import React, { useLayoutEffect, useRef } from 'react';
import ReactJson from 'react-json-view';

import { useTheme } from '@/components/theme-provider';
import { traverse } from 'object-traversal';


import { isStepFileUrl } from '@/lib/utils';
import { createRoot } from 'react-dom/client';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type JsonViewerProps = {
  json: any;
  title: string;
};

const JsonViewer = React.memo(({ json, title }: JsonViewerProps) => {
  const { theme } = useTheme();

  const viewerTheme = theme === 'dark' ? 'pop' : 'rjv-default';

  const downloadable: any = useRef()

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(downloadable.current, null, 2));
    toast({
      title: t('Copied to clipboard'),
      duration: 1000,
    });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(downloadable.current, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    handleDownloadFile(url, ".json");
  };

  const handleDownloadFile = (fileUrl: string, ext: string = "") => {
    const url = fileUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useLayoutEffect(() => {
    downloadable.current = structuredClone(json)
    if (isStepFileUrl(downloadable.current)) {
      downloadable.current = undefined
    } else if (typeof json === "object") {

      traverse(downloadable.current, ({ parent, key, value }) => {
        if (isStepFileUrl(value) && parent && key) {
          delete parent[key]
        }
      })

      const stringValuesHTML = Array.from(document.getElementsByClassName('string-value'));

      const stepFileUrlsHTML = stringValuesHTML.filter((el) => isStepFileUrl(el.innerHTML) || isStepFileUrl(el.parentElement!.nextElementSibling?.innerHTML));

      stepFileUrlsHTML.forEach((el: Element) => {
        const fileUrl = el.innerHTML.replaceAll('"', '').trim().replace('\n', '');

        el.className += ' hidden';
        const rootElem = document.createElement('div');
        const root = createRoot(rootElem);

        el.parentElement!.replaceChildren(...[
          el as Node,
          rootElem as Node,
        ]);

        root.render(
          <div {...{ "data-file-root": "true" }}>
            {fileUrl.includes("file://") ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-0">
                      <Button variant="ghost" size="sm" disabled className="flex items-center gap-2 p-2 max-h-[20px] text-xs">
                        <EyeOff className="w-4 h-4" />
                        {t('View File')}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t("Files can only be viewed while testing.")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-0">
                <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(fileUrl)} className="flex items-center gap-2 p-2 max-h-[20px] text-xs">
                  <Eye className="w-4 h-4" />
                  {t('View File')}
                </Button>
              </div>
            )}
          </div>
        );
      });
    }
  });

  if (isStepFileUrl(json)) {
    return <div className="flex items-center gap-0">
      <Button variant={'ghost'} size={'sm'} onClick={() => handleDownloadFile(json)} className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        {t('View File')}
      </Button>
    </div>
  }

  return (
    <div className="rounded-lg border border-solid border-dividers overflow-hidden">
      <div className="px-4 py-3 flex border-solid border-b border-dividers justfy-center items-center">
        <div className="flex-grow justify-center items-center">
          <span className="text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-0">
          <Button variant={'ghost'} size={'sm'} onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant={'ghost'} size={'sm'} onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {json && (
        <>
          {typeof json !== 'string' && typeof json !== 'object' && (
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto p-2">
              {JSON.stringify(json)}
            </pre>
          )}
          {typeof json === 'string' && (
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto p-2">
              {json}
            </pre>
          )}
          {typeof json === 'object' && (
            <ReactJson
              style={{
                overflowX: 'auto',
              }}
              theme={viewerTheme}
              enableClipboard={false}
              groupArraysAfterLength={100}
              displayDataTypes={false}
              name={false}
              quotesOnKeys={false}
              src={json}
            />
          )}
        </>
      )}
    </div>
  );
});

JsonViewer.displayName = 'JsonViewer';
export { JsonViewer };
