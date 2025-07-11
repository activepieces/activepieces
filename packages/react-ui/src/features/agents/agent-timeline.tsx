import { t } from 'i18next';
import { SparkleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AgentStepBlock,
  ContentBlockType,
  MarkdownVariant,
} from '@activepieces/shared';

import { AgentToolBlock } from './agent-tool-block';
import { agentHooks } from './lib/agent-hooks';

type AgentTimelineProps = {
  steps: AgentStepBlock[];
  className?: string;
  prompt: string;
  isDone: boolean;
  agentId: string;
};

const AgentTimeline = ({
  steps,
  className = '',
  prompt,
  isDone,
  agentId,
}: AgentTimelineProps) => {
  return (
    <ScrollArea className={`h-full p-4 ${className}`}>
      {prompt !== '' && <AgentPromptBlock prompt={prompt} />}
      <div className=" flex flex-col gap-3">
        {steps.map((step, index) => {
          return (
            <div key={index} className="animate-fade">
              {step.type === ContentBlockType.MARKDOWN && (
                <ApMarkdown
                  markdown={step.markdown}
                  variant={MarkdownVariant.BORDERLESS}
                />
              )}
              {step.type === ContentBlockType.TOOL_CALL && (
                <AgentToolBlock block={step} index={index} />
              )}
            </div>
          );
        })}
        {!isDone && <AgentStepSkeleton agentId={agentId} />}
      </div>
    </ScrollArea>
  );
};

const AgentStepSkeleton = ({ agentId }: { agentId: string }) => {
  const { data: agent } = agentHooks.useGet(agentId);
  const [dots, setDots] = useState('...');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === '....' ? '.' : `${prev}.`));
    }, 250);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center px-4 py-3 text-sm font-medium gap-3">
      <ImageWithFallback
        src={agent?.profilePictureUrl}
        alt={agent?.displayName}
        className="size-8"
      ></ImageWithFallback>
      {`${t('Working my magic')} ${dots}`}
    </div>
  );
};

const AgentPromptBlock = ({ prompt }: { prompt: string }) => {
  return (
    <div className="animate-fade mb-3">
      <Accordion type="single" collapsible defaultValue="prompt">
        <AccordionItem value="prompt" className="border-none">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <SparkleIcon className="size-4 text-primary" /> {t('Prompt')}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>{prompt}</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export { AgentTimeline };
