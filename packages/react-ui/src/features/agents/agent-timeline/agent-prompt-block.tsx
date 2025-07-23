import { t } from 'i18next';
import { SparkleIcon } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type AgentPromptBlockProps = {
  prompt: string;
};

export const AgentPromptBlock = ({ prompt }: AgentPromptBlockProps) => {
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
