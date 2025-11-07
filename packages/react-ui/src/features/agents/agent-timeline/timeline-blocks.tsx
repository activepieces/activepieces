import { t } from 'i18next';
import {
  CircleX,
  Loader2,
  Wrench,
  MessageSquareText,
  CircleCheckBig,
  CheckCheck,
  SquareTerminal,
} from 'lucide-react';

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
  MarkdownContentBlock,
  MarkdownVariant,
  ToolCallStatus,
  type ToolCallContentBlock,
} from '@activepieces/shared';

interface AgentToolBlockProps {
  block: ToolCallContentBlock;
  index: number;
}

type ToolCallOutput = {
  success: boolean;
  content: { type: string; text: string }[];
  resolvedFields: Record<string, unknown>;
};

const INTERNAL_TOOLS = ['markAsComplete'];

const parseJsonOrReturnOriginal = (json: unknown) => {
  try {
    return JSON.parse(json as string);
  } catch {
    return json;
  }
};

const TimelineItem = ({
  icon,
  children,
  iconLeft = 'left-0',
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  iconLeft?: string;
}) => {
  return (
    <div className="relative pl-7 animate-fade">
      <div
        className={`absolute bg-background ${iconLeft} w-4 h-4 top-3.5 flex items-center justify-center`}
      >
        {icon}
      </div>

      {children}
    </div>
  );
};

export const AgentToolBlock = ({ block, index }: AgentToolBlockProps) => {
  if (INTERNAL_TOOLS.includes(block.toolName ?? '')) return null;

  const { data: metadata, isLoading } = mcpHooks.useMcpToolMetadata(block);
  const output = block.output as ToolCallOutput | null;

  const isDone = block.status === ToolCallStatus.COMPLETED;
  const isSuccess = output?.success ?? true;
  const hasInstructions = !isNil(block.input?.instructions);
  const resolvedFields = output?.resolvedFields ?? null;
  const result = output?.content
    ? parseJsonOrReturnOriginal(output.content[0].text)
    : null;

  const defaultTab = resolvedFields ? 'resolvedFields' : 'result';

  const renderStatusIcon = () => {
    if (!isDone) return <Loader2 className="h-4 w-4 animate-spin shrink-0" />;
    return isSuccess ? (
      <CheckCheck className="h-4 w-4 text-success shrink-0" />
    ) : (
      <CircleX className="h-4 w-4 text-destructive shrink-0" />
    );
  };

  const renderToolIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin shrink-0" />;
    if (metadata?.logoUrl)
      return (
        <img
          src={metadata.logoUrl}
          alt="Tool logo"
          className="h-4 w-4 object-contain shrink-0"
        />
      );
    return <Wrench className="h-4 w-4 shrink-0" />;
  };

  const ToolHeader = (
    <div className="flex items-center gap-2 w-full">
      {renderToolIcon()}
      <span
        className={`flex gap-1 items-center ${
          !isSuccess ? 'text-destructive' : ''
        }`}
      >
        <span className="text-sm font-semibold">
          {isLoading ? 'Loading...' : metadata?.displayName ?? 'Unknown Tool'}
          {!isSuccess && t(' (Failed)')}
        </span>
      </span>
    </div>
  );

  return (
    <TimelineItem key={`step-${index}-${block.type}`} icon={renderStatusIcon()}>
      <Accordion
        type="single"
        collapsible
        className="border-0 w-full bg-accent/20 rounded-md text-foreground border border-border"
      >
        <AccordionItem value={`block-${index}`} className="border-0">
          <AccordionTrigger className="p-3 text-sm">
            {ToolHeader}
          </AccordionTrigger>

          <AccordionContent>
            <div className="space-y-3 w-full my-2">
              {hasInstructions && (
                <ApMarkdown
                  variant={MarkdownVariant.BORDERLESS}
                  markdown={block.input?.instructions as string}
                />
              )}

              {!isLoading && (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList variant="outline" className="mb-0">
                    <TabsTrigger
                      value="resolvedFields"
                      variant="outline"
                      className="text-xs"
                    >
                      {t('Parameters')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="result"
                      variant="outline"
                      className="text-xs"
                    >
                      {t('Output')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="resolvedFields"
                    className="overflow-hidden mt-3"
                  >
                    {resolvedFields ? (
                      <DataList data={resolvedFields} />
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        {t('No resolved fields')}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="result" className="overflow-hidden mt-3">
                    {result ? (
                      <SimpleJsonViewer
                        data={result}
                        hideCopyButton
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
    </TimelineItem>
  );
};

export const MarkdownBlock = ({
  index,
  step,
}: {
  index: number;
  step: MarkdownContentBlock;
}) => {
  return (
    <TimelineItem
      key={`step-${index}-${step.type}`}
      icon={<MessageSquareText className="h-4 w-4 text-muted-foreground" />}
    >
      <div className="bg-accent/20 rounded-md p-3 text-sm text-foreground border border-border">
        <ApMarkdown
          markdown={step.markdown}
          variant={MarkdownVariant.BORDERLESS}
        />
      </div>
    </TimelineItem>
  );
};

export const ThinkingBlock = () => {
  return (
    <TimelineItem
      icon={<Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
    >
      <div className="bg-accent/20 rounded-md p-3 w-full text-sm text-foreground border border-border animate-pulse">
        <span>{t('Agent is thinking...')}</span>
      </div>
    </TimelineItem>
  );
};

export const PromptBlock = ({ prompt }: { prompt: string }) => {
  return (
    <TimelineItem icon={<SquareTerminal className="h-4 w-4 text-primary" />}>
      <div className="bg-primary/5 rounded-md p-3 text-sm text-foreground border border-border">
        <ApMarkdown markdown={prompt} variant={MarkdownVariant.BORDERLESS} />
      </div>
    </TimelineItem>
  );
};

export const DoneBlock = () => {
  return (
    <TimelineItem icon={<CircleCheckBig className="h-4 w-4 text-green-600" />}>
      <div className="border border-green-500/40 bg-green-50/60 rounded-md p-3 text-sm text-green-700 font-medium flex items-center gap-2">
        <span>{t('Done!')}</span>
      </div>
    </TimelineItem>
  );
};

export const FailedBlock = () => {
  return (
    <TimelineItem icon={<CircleX className="h-4 w-4 text-red-600" />}>
      <div className="border border-red-500/40 bg-red-50/60 rounded-md p-3 text-sm text-red-700 font-medium flex items-center gap-2">
        <span>{t('Failed')}</span>
      </div>
    </TimelineItem>
  );
};
