import { Loader2, Wrench, CircleCheck } from 'lucide-react';

import { ApMarkdown } from '@/components/custom/markdown';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  isNil,
  MarkdownVariant,
  agentMarkdownParser,
} from '@activepieces/shared';

interface TodoMarkdownProps {
  content: string;
}

export const TodoMarkdown = ({ content }: TodoMarkdownProps) => {
  const blocks = agentMarkdownParser.parse(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <div key={index} className="prose prose-sm max-w-none">
              <ApMarkdown
                markdown={block.text}
                variant={MarkdownVariant.BORDERLESS}
              />
            </div>
          );
        }

        const isDone = block.status === 'done';

        return (
          <Accordion
            key={index}
            type="multiple"
            className="rounded-md border"
            defaultValue={[]}
          >
            <AccordionItem value={`block-${index}`} className="border-none">
              <AccordionTrigger className="px-4 py-3 flex items-center gap-3 transition-colors">
                {block.logoUrl ? (
                  <img
                    src={block.logoUrl}
                    alt="Logo"
                    className="h-5 w-5 rounded-md object-contain shrink-0"
                  />
                ) : (
                  <div className="h-5 w-5 shrink-0">
                    <Wrench className="h-5 w-5" />
                  </div>
                )}
                <span className="text-sm font-medium flex-1 text-left">
                  {block.toolDisplayName}
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
              <AccordionContent className="p-3">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      Arguments
                    </div>
                    <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-all">
                      {JSON.stringify(block.args, null, 2)}
                    </pre>
                  </div>
                  {!isNil(block.result) && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Result
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <ApMarkdown
                          markdown={block.result}
                          variant={MarkdownVariant.BORDERLESS}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </div>
  );
};
