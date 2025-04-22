import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { t } from 'i18next';
import { Copy, Check } from 'lucide-react';
import React, { useState } from 'react';

import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

interface SimpleJsonViewerProps {
  data: any;
  readOnly?: boolean;
  title?: string;
  hideCopyButton?: boolean;
}

export const SimpleJsonViewer: React.FC<SimpleJsonViewerProps> = ({
  data,
  readOnly = true,
  title,
  hideCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  // Format the JSON for display
  const formattedJson = JSON.stringify(data, null, 2);

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

  return (
    <div className="rounded-lg overflow-hidden text-foreground w-full relative">
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
      <div className="p-2">
        <CodeMirror
          value={formattedJson}
          extensions={[json()]}
          editable={!readOnly}
          theme={theme === 'dark' ? 'dark' : 'light'}
          height="auto"
          maxHeight="400px"
          style={{
            fontSize: '14px',
            overflow: 'auto',
            width: '100%',
            backgroundColor: '#f5f4ed',
          }}
          className="text-foreground"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
          }}
        />
      </div>
    </div>
  );
};
