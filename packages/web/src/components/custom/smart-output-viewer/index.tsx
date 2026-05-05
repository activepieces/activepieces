import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { JsonViewer } from '@/components/custom/json-viewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { OutputArrayList } from './output-array-list';
import { OutputFieldList } from './output-field-list';
import { OutputGenericFieldList } from './output-generic-field-list';
import { isTabularArray, OutputTableView } from './output-table-view';
import { OutputDisplayHints } from './types';
import { isUserDefinedPiece } from './user-defined-pieces';

const MAX_TEXT_DISPLAY_LENGTH = 500;

function OutputTextDisplay({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (text === '') {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  const isLong = text.length > MAX_TEXT_DISPLAY_LENGTH;
  const displayText =
    isLong && !expanded ? text.slice(0, MAX_TEXT_DISPLAY_LENGTH) + '...' : text;

  return (
    <div className="p-4">
      <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">
        {displayText}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {expanded ? t('Show less') : t('Show more')}
        </button>
      )}
    </div>
  );
}

function OutputViewerShell({
  json,
  title,
  friendlyContent,
}: {
  json: unknown;
  title: string;
  friendlyContent: React.ReactNode;
}) {
  const serializedJson = useMemo(() => JSON.stringify(json, null, 2), [json]);

  const handleDownload = () => {
    const blob = new Blob([serializedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-solid border-dividers overflow-hidden">
      <Tabs defaultValue="friendly">
        <div className="px-3 py-2 flex border-solid border-b border-dividers items-center gap-1">
          <span className="text-md grow">{title}</span>
          <div className="flex items-center gap-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('Download JSON')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CopyButton
              textToCopy={serializedJson}
              variant="ghost"
              tooltipSide="bottom"
            />
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="friendly" className="text-xs px-2 h-6">
              {t('Friendly View')}
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-xs px-2 h-6">
              {t('Raw JSON')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="friendly" className="mt-0">
          {friendlyContent}
        </TabsContent>
        <TabsContent value="raw" className="mt-0">
          <JsonViewer
            json={json}
            title={title}
            hideHeader={true}
            className="border-0 rounded-none"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SmartOutputViewer({
  json,
  title,
  pieceName,
  pieceHints,
}: SmartOutputViewerProps) {
  const pieceDefinedHints = pieceHints ?? null;
  const isUserDefined = isUserDefinedPiece(pieceName);
  const isJsonObject = isObject(json);

  if (typeof json === 'string') {
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={<OutputTextDisplay text={json} />}
      />
    );
  }

  if (Array.isArray(json) && json.length > 0) {
    const tabular = isTabularArray(json);
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={
          tabular ? (
            <OutputTableView items={json} />
          ) : (
            <OutputArrayList items={json} />
          )
        }
      />
    );
  }

  if (isUserDefined && isJsonObject && Object.keys(json).length > 0) {
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={<OutputGenericFieldList json={json} />}
      />
    );
  }

  if (pieceDefinedHints && isJsonObject) {
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={
          <OutputFieldList json={json} hints={pieceDefinedHints} />
        }
      />
    );
  }

  return <JsonViewer json={json} title={title} />;
}

export { SmartOutputViewer };

type SmartOutputViewerProps = {
  json: unknown;
  title: string;
  pieceName?: string;
  pieceHints?: OutputDisplayHints | null;
};
