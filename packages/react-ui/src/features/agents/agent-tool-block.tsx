import { t } from 'i18next';
import { Loader2, Wrench, CircleCheck, CircleX } from 'lucide-react';

import { ApMarkdown } from '@/components/custom/markdown';
import { SimpleJsonViewer } from '@/components/simple-json-viewer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import {
  isNil,
  MarkdownVariant,
  ToolCallContentBlock,
  ToolCallStatus,
} from '@activepieces/shared';

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

  return (
    <Accordion type="multiple" defaultValue={[`block-${index}`]}>
      <AccordionItem value={`block-${index}`}>
        <AccordionTrigger className="flex items-center gap-3 transition-colors">
          {isLoading ? (
            <div className="h-5 w-5 shrink-0">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : metadata?.logoUrl ? (
            <img
              src={metadata.logoUrl}
              alt="Logo"
              className="h-5 w-5 object-contain shrink-0"
            />
          ) : (
            <div className="h-5 w-5 shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
          )}
          <span className="text-sm font-medium flex-1 text-left">
            {isLoading ? 'Loading...' : metadata?.displayName ?? 'Unknown Tool'}
          </span>
          {isDone ? (
            markAsComplete ? (
              <CircleCheck
                className="h-4 w-4 text-emerald-600 shrink-0"
                style={{ transform: 'none' }}
              />
            ) : (
              <CircleX className="h-4 w-4 text-red-600 shrink-0" />
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          )}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground">
                {hasInstructions ? t('Instructions') : t('Input')}
              </div>
              {hasInstructions ? (
                <ApMarkdown
                  variant={MarkdownVariant.BORDERLESS}
                  markdown={JSON.stringify(block.input?.instructions)}
                />
              ) : (
                <SimpleJsonViewer data={block.input} hideCopyButton={true} />
              )}
            </div>
            {!isNil(resolvedFields) && (
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {t('Resolved Fields')}
                </div>
                <SimpleJsonViewer data={resolvedFields} hideCopyButton={true} />
              </div>
            )}
            {!isNil(output) && (
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {t('Result')}
                </div>
                <SimpleJsonViewer data={output} hideCopyButton={true} />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
