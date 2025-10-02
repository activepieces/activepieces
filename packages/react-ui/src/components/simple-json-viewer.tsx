import { t } from 'i18next';
import { Copy, Check } from 'lucide-react';
import React, { useState } from 'react';
import ReactJson from 'react-json-view';

import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

interface SimpleJsonViewerProps {
  data: any;
  readOnly?: boolean;
  hideCopyButton?: boolean;
  maxHeight?: number;
}

export const SimpleJsonViewer: React.FC<SimpleJsonViewerProps> = ({
  data,
  readOnly = true,
  hideCopyButton = false,
  maxHeight = 400,
}) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const formattedJson =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    toast({
      title: t('Copied to clipboard'),
      duration: 1000,
    });

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const viewerTheme = theme === 'dark' ? 'bright' : 'rjv-default';

  return (
    <div
      className="w-full relative text-foreground overflow-hidden"
      style={{
        maxWidth: '100%',
      }}
    >
      {!hideCopyButton && (
        <div className="absolute top-2 right-5 z-10">
          <Button
            variant="transparent"
            size="sm"
            onClick={handleCopy}
            className="p-0 "
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy
                className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              />
            )}
          </Button>
        </div>
      )}
      <div
        className="p-2"
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : '400px',
          overflow: 'auto',
          overflowX: 'auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {typeof data === 'string' ? (
          <pre className="text-sm whitespace-pre-wrap break-all overflow-x-auto p-2">
            {data}
          </pre>
        ) : (
          <div style={{ minWidth: 0, width: '100%', height: '100%' }}>
            <ReactJson
              style={{
                overflowX: 'auto',
                padding: '0.5rem',
                fontSize: '14px',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
              theme={viewerTheme}
              enableClipboard={false}
              groupArraysAfterLength={20}
              displayDataTypes={false}
              name={false}
              quotesOnKeys={false}
              src={data}
              collapsed={false}
              displayObjectSize={false}
              iconStyle="triangle"
              shouldCollapse={false}
              onEdit={readOnly ? false : undefined}
              onAdd={readOnly ? false : undefined}
              onDelete={readOnly ? false : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
};
