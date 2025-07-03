import { json } from '@codemirror/lang-json';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { EditorState, EditorView } from '@uiw/react-codemirror';
import { t } from 'i18next';
import { Copy, Download, Check } from 'lucide-react';
import React, { useState } from 'react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { isNil } from '@activepieces/shared';

type CodeMirrorJsonViewerProps = {
  json: any;
  title: string;
  hideDownload?: boolean;
  readOnly?: boolean;
  maxHeight?: string;
  backgroundColor?: string;
};

export const CodeMirrorJsonViewer = React.memo(
  ({ 
    json: unclearJson, 
    title, 
    hideDownload = false, 
    readOnly = true,
    maxHeight,
    backgroundColor = '#fafafa'
  }: CodeMirrorJsonViewerProps) => {
    const { theme } = useTheme();
    const [copied, setCopied] = useState(false);
    
    const editorTheme = theme === 'dark' ? githubDark : githubLight;
    
    const formattedJson = React.useMemo(() => {
      if (isNil(unclearJson)) {
        return unclearJson === null ? 'null' : 'undefined';
      }
      if (typeof unclearJson === 'string') {
        return unclearJson;
      }
      if (typeof unclearJson === 'object') {
        return JSON.stringify(unclearJson, null, 2);
      }
      return JSON.stringify(unclearJson);
    }, [unclearJson]);

    const extensions = [
      EditorView.theme({
        '&.cm-editor': {
          backgroundColor: backgroundColor + ' !important',
        },
        '.cm-content': {
          backgroundColor: backgroundColor + ' !important',
        },
        '.cm-gutters': {
          backgroundColor: backgroundColor + ' !important',
        },
      }),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.lineWrapping,
      json(),
    ];

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

    const handleDownload = () => {
      const blob = new Blob([formattedJson], {
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
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <div className="text-xs font-medium text-muted-foreground">
            {title}
          </div>
          <div className="flex items-center gap-0">
            {!hideDownload && (
              <Button variant={'ghost'} size={'sm'} onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button variant={'ghost'} size={'sm'} onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="text-xs bg-muted/50 px-3 rounded-md whitespace-pre-wrap break-all">
          <CodeMirror
            value={formattedJson}
            className="border-none"
            height="auto"
            maxHeight={maxHeight ?? '100%'}
            width="100%"
            maxWidth="100%"
            basicSetup={{
              foldGutter: true,
              lineNumbers: false,
              searchKeymap: false,
              lintKeymap: true,
              autocompletion: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
            lang="json"
            theme={editorTheme}
            readOnly={readOnly}
            extensions={extensions}
            style={{
              backgroundColor: backgroundColor + ' !important',
            }}
          />
        </div>
      </div>
    );
  },
);

CodeMirrorJsonViewer.displayName = 'CodeMirrorJsonViewer';