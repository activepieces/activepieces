import { AgentKnowledgeBaseTool, KnowledgeBaseSourceType } from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

type AgentKnowledgeBaseToolsAccordionProps = {
  disabled?: boolean;
  tools: AgentKnowledgeBaseTool[];
  removeTool: (toolName: string) => void;
};

export const AgentKnowledgeBaseToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentKnowledgeBaseToolsAccordionProps) => {
  const { setShowAddKbDialog } = useKnowledgeBaseToolDialogStore();

  return (
    <AccordionItem value="knowledge-base" className="border-b last:border-0">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent transition-all">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            <BookOpen className="size-3.5" />
          </div>
          <span className="text-sm font-medium">{t('Knowledge Base')}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <div
              key={tool.toolName}
              onClick={() => setShowAddKbDialog(true, tool)}
              className={cn(
                'group flex items-center gap-2 px-3 py-1 cursor-pointer rounded-full border bg-muted/50',
                disabled && 'opacity-50 pointer-events-none',
              )}
            >
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                {tool.sourceType === KnowledgeBaseSourceType.FILE
                  ? t('File')
                  : t('Table')}
              </span>
              <span className="text-xs font-medium max-w-40 truncate">
                {tool.sourceName}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTool(tool.toolName);
                    }}
                    variant="ghost"
                    size="icon"
                    className="
                      size-5 p-0.5
                      text-muted-foreground
                      hover:text-destructive
                      hover:bg-destructive/10
                      transition
                    "
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Remove knowledge source')}</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() => setShowAddKbDialog(true)}
        >
          <Plus className="size-3 mr-1" />
          {t('Add Knowledge Source')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
