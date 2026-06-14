import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import React, { useMemo } from 'react';

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
import { OutputSchemaArrayList } from './output-schema-array-list';
import { OutputTableView, selectArrayFriendlyView } from './output-table-view';
import { OutputSchema } from './types';

function OutputTextDisplay({ text }: { text: string }) {
  if (text === '') {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  return (
    <div className="p-4">
      <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">
        {text}
      </pre>
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
  pieceSchema,
}: SmartOutputViewerProps) {
  const pieceDefinedSchema = pieceSchema ?? null;
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
    const arrayView = selectArrayFriendlyView({
      items: json,
      schema: pieceDefinedSchema,
    });
    const friendlyContent =
      arrayView.kind === 'table' ? (
        <OutputTableView items={json} />
      ) : arrayView.kind === 'schema' ? (
        <OutputSchemaArrayList items={json} schema={arrayView.schema} />
      ) : (
        <OutputArrayList items={json} />
      );
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={friendlyContent}
      />
    );
  }

  if (pieceDefinedSchema && isJsonObject) {
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={
          <OutputFieldList json={json} schema={pieceDefinedSchema} />
        }
      />
    );
  }

  if (isJsonObject) {
    return (
      <OutputViewerShell
        json={json}
        title={title}
        friendlyContent={<OutputGenericFieldList json={json} />}
      />
    );
  }

  return <JsonViewer json={json} title={title} />;
}

export { SmartOutputViewer };

type SmartOutputViewerProps = {
  json: unknown;
  title: string;
  pieceSchema?: OutputSchema | null;
};
