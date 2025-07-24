import { t } from 'i18next';

import { ApMarkdown } from '@/components/custom/markdown';
import { DataList } from '@/components/data-list';
import { SimpleJsonViewer } from '@/components/simple-json-viewer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import {
  isNil,
  MarkdownVariant,
  ToolCallContentBlock,
  ToolCallStatus,
} from '@activepieces/shared';

import { AgentToolBlockHeader } from './agent-tool-block-header';

interface AgentToolBlockProps {
  block: ToolCallContentBlock;
  index: number;
}

type ToolCallOutput = {
  success: boolean;
  content: {
    type: string;
    text: string;
  }[];
  resolvedFields: Record<string, unknown>;
};

function parseJsonOrReturnOriginal(json: unknown) {
  try {
    return JSON.parse(json as string);
  } catch (error) {
    return json;
  }
}

const internalTools = ['markAsComplete'];

export const AgentToolBlock = ({ block, index }: AgentToolBlockProps) => {
  const { data: metadata, isLoading } = mcpHooks.useMcpToolMetadata(block);
  const isDone = block.status === ToolCallStatus.COMPLETED;
  const outputAsToolCallOutput = block.output as ToolCallOutput | null;

  const hasInstructions = !isNil(block.input?.instructions);
  const resolvedFields = !isNil(outputAsToolCallOutput?.resolvedFields)
    ? outputAsToolCallOutput.resolvedFields
    : null;
  const output = !isNil(outputAsToolCallOutput?.content)
    ? parseJsonOrReturnOriginal(outputAsToolCallOutput.content[0].text)
    : null;

  const markAsComplete = !isNil(outputAsToolCallOutput?.success)
    ? outputAsToolCallOutput.success
    : true;

  const defaultTab = !isNil(resolvedFields) ? 'resolvedFields' : 'result';

  const toolName = block.toolName;
  const isInternalTool =
    !isNil(toolName) && internalTools.includes(toolName as string);

  if (isInternalTool) {
    return (
      <div className="flex items-center gap-3 py-3 border rounded-md px-4">
        <AgentToolBlockHeader
          metadata={metadata}
          isLoading={isLoading}
          isDone={isDone}
          markAsComplete={markAsComplete}
        />
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={[]}>
      <AccordionItem value={`block-${index}`}>
        <AccordionTrigger className="flex items-center gap-3 transition-colors">
          <AgentToolBlockHeader
            metadata={metadata}
            isLoading={isLoading}
            isDone={isDone}
            markAsComplete={markAsComplete}
          />
        </AccordionTrigger>
        <AccordionContent className="mt-4">
          <div className="space-y-3">
            {hasInstructions && (
              <>
                <div className="border-t border-muted-foreground/20 my-2" />
                <div className="flex flex-col gap-1 mt-4">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wide">
                    {t('Instructions')}
                  </div>
                  <ApMarkdown
                    variant={MarkdownVariant.BORDERLESS}
                    markdown={block.input?.instructions as string}
                  />
                </div>
              </>
            )}
            {!isLoading && (
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList variant="outline" className="mb-0">
                  <TabsTrigger value="resolvedFields" variant="outline">
                    {t('Parameters')}
                  </TabsTrigger>
                  <TabsTrigger value="result" variant="outline">
                    {t('Output')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="resolvedFields"
                  className="h-[300px] overflow-hidden mt-3"
                >
                  {!isNil(resolvedFields) ? (
                    <DataList data={resolvedFields} />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {t('No resolved fields')}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="result" className="overflow-hidden mt-3">
                  {!isNil(output) ? (
                    <SimpleJsonViewer
                      data={output}
                      hideCopyButton={true}
                      maxHeight={300}
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {t('No result')}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
