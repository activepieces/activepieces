import { t } from 'i18next';
import { Loader2, Wrench, CircleCheck } from 'lucide-react';

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

export const AgentToolBlock = ({ block, index }: AgentToolBlockProps) => {
  const { data: metadata, isLoading } = mcpHooks.useMcpToolMetadata(block);
  const isDone = block.status === ToolCallStatus.COMPLETED;
  const { output, isJson } = extractMarkdownFromOutput(block.output);
  return (
    <Accordion type="multiple"  defaultValue={[]}>
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
            <CircleCheck
              className="h-4 w-4 text-emerald-600 shrink-0"
              style={{ transform: 'none' }}
            />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          )}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                {t('Arguments')}
              </div>
              <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-all">
                {JSON.stringify(block.input, null, 2)}
              </pre>
            </div>
            {!isNil(block.output) && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {t('Result')}
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  {isJson ? (
                    <pre className="text-xs break-all bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-all">
                      {output}
                    </pre>
                  ) : (
                    <ApMarkdown
                      className="text-xs break-words"
                      markdown={output}
                      variant={MarkdownVariant.BORDERLESS}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

//TODO: Check how to simplify this logic and make it typed
const extractMarkdownFromOutput = (output: unknown) => {
  if (isNil(output)) {
    return { output: '', isJson: false };
  }
  if (typeof output === 'string') {
    return { output, isJson: false };
  }
  if (output !== null && typeof output === 'object' && 'content' in output) {
    if (typeof output.content === 'string') {
      return { output: output.content, isJson: false };
    }
    if (Array.isArray(output.content)) {
      return {
        output: output.content.map((item) => item.text).join('\n'),
        isJson: false,
      };
    }
    return { output: JSON.stringify(output.content, null, 2), isJson: true };
  }
  return { output: '', isJson: false };
};
