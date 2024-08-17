import { Copy, Download } from 'lucide-react';
import React from 'react';
import ReactJson from 'react-json-view';

import { useTheme } from '@/components/theme-provider';

import { Button } from './ui/button';
import { toast } from './ui/use-toast';

type JsonViewerProps = {
  json: any;
  title: string;
};

const JsonViewer = React.memo(({ json, title }: JsonViewerProps) => {
  const { theme } = useTheme();

  const viewerTheme = theme === 'dark' ? 'pop' : 'rjv-default';
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    toast({
      title: 'Copied to clipboard',
      duration: 1000,
    });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
