import {
  AgentKnowledgeBaseTool,
  AgentTool,
  AIProviderName,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, FileText, Table2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PROVIDER_EMBEDDING_MODELS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { AgentKnowledgeBaseDialog } from '../knowledge-base-dialog';
import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

import { AddKnowledgeBaseDropdown } from './add-knowledge-base-dropdown';

function KnowledgeBaseToolPills({
  tools,
  disabled,
  removeTool,
}: {
  tools: AgentKnowledgeBaseTool[];
  disabled?: boolean;
  removeTool: (toolName: string) => void;
}) {
  const { setShowAddKbDialog } = useKnowledgeBaseToolDialogStore();

  return (
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
          {tool.sourceType === KnowledgeBaseSourceType.FILE ? (
            <FileText className="size-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Table2 className="size-3.5 text-muted-foreground shrink-0" />
          )}
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
  );
}

export const KnowledgeBaseSection = ({
  disabled,
  tools,
  allTools,
  removeTool,
  onToolsUpdate,
  selectedProvider,
}: KnowledgeBaseSectionProps) => {
  const embeddingModel = selectedProvider
    ? PROVIDER_EMBEDDING_MODELS[selectedProvider]
    : undefined;
  const supportsEmbeddings = !!embeddingModel;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium">{t('Knowledge Base')}</h2>

      <div className="mt-2">
        {tools.length > 0 ? (
          <div className="border rounded-md overflow-hidden p-4">
            <KnowledgeBaseToolPills
              tools={tools}
              disabled={disabled}
              removeTool={removeTool}
            />

            {supportsEmbeddings ? (
              <div className="mt-4">
                <AddKnowledgeBaseDropdown disabled={disabled} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">
                {t(
                  'The selected provider does not support embeddings. Switch to a provider like OpenAI or Google for knowledge base to work.',
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-4 py-8 text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-full border bg-background">
              <BookOpen className="size-5" />
            </div>
            {supportsEmbeddings ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(
                    'Add files or tables as knowledge sources for your agent.',
                  )}
                </p>
                <AddKnowledgeBaseDropdown disabled={disabled} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  'Knowledge base requires a provider that supports embeddings, such as OpenAI or Google.',
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <AgentKnowledgeBaseDialog
        tools={allTools}
        onToolsUpdate={onToolsUpdate}
      />
    </div>
  );
};

type KnowledgeBaseSectionProps = {
  disabled?: boolean;
  tools: AgentKnowledgeBaseTool[];
  allTools: AgentTool[];
  removeTool: (toolName: string) => void;
  onToolsUpdate: (tools: AgentTool[]) => void;
  selectedProvider?: AIProviderName;
};
