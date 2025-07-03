import { t } from 'i18next';
import { Loader2, Wrench, CircleCheck, CircleX } from 'lucide-react';

import { CodeMirrorJsonViewer } from '@/components/code-mirror-json-viewer';
import { ApMarkdown } from '@/components/custom/markdown';
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
export const AgentToolBlock = ({ block, index }: AgentToolBlockProps) => {
  const { data: metadata, isLoading } = mcpHooks.useMcpToolMetadata(block);
  const isDone = block.status === ToolCallStatus.COMPLETED;
  const outputAsToolCallOutput = block.output as ToolCallOutput;
  const output =
    block.output && outputAsToolCallOutput.content?.[0]?.text
      ? JSON.parse(outputAsToolCallOutput.content[0].text)
      : '';
  const resolvedFields =
    block.output && outputAsToolCallOutput.resolvedFields
      ? outputAsToolCallOutput.resolvedFields
      : {};
  const markAsComplete =
    block.output &&
    (outputAsToolCallOutput.success === true ||
      outputAsToolCallOutput.success === undefined);
  return (
    <Accordion type="multiple" defaultValue={[]}>
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
                {t('Instructions')}
              </div>
              <ApMarkdown
                variant={MarkdownVariant.BORDERLESS}
                markdown={JSON.stringify(
                  block.input?.instructions ?? block.input,
                )}
              />
            </div>
            {!isNil(resolvedFields) && (
              <CodeMirrorJsonViewer
                json={resolvedFields}
                hideDownload={true}
                title={t('Resolved Fields')}
              />
            )}
            {!isNil(output) && (
              <CodeMirrorJsonViewer json={output} title={t('Result')} />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
