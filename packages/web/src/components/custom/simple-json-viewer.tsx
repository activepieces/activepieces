import React from 'react';
import ReactJson from 'react-json-view';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { useTheme } from '@/components/providers/theme-provider';
import { syntaxTheme } from '@/lib/syntax-theme';

interface SimpleJsonViewerProps {
  data: any;
  readOnly?: boolean;
  hideCopyButton?: boolean;
  maxHeight?: number;
  fontSize?: string;
}

export const SimpleJsonViewer: React.FC<SimpleJsonViewerProps> = ({
  data,
  readOnly = true,
  hideCopyButton = false,
  maxHeight = 400,
  fontSize = '14px',
}) => {
  const { resolvedTheme } = useTheme();

  const viewerTheme = syntaxTheme.jsonView(resolvedTheme);

  return (
    <div
      className="w-full relative text-gray-12 overflow-hidden"
      style={{
        maxWidth: '100%',
      }}
    >
      {!hideCopyButton && (
        <div className="absolute top-2 right-5 z-10">
          <CopyButton
            value={data}
            variant="ghost"
            size="sm"
            className="p-0 hover:bg-transparent"
          />
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
          <pre
            className="whitespace-pre-wrap break-all overflow-x-auto p-2"
            style={{ fontSize }}
          >
            {data}
          </pre>
        ) : (
          <div style={{ minWidth: 0, width: '100%', height: '100%' }}>
            <ReactJson
              style={{
                overflowX: 'auto',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                fontSize,
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
