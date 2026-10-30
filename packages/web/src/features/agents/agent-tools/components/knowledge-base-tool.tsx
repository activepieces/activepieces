import { isNil } from '@activepieces/core-utils';
import {
  AgentKnowledgeBaseTool,
  AgentTool,
  ApFlagId,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, FileText, Table2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { AgentKnowledgeBaseDialog } from '../knowledge-base-dialog';
import { useKnowledgeBaseEmbeddingSource } from '../knowledge-base-dialog/knowledge-base-hooks';
import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

import { AddKnowledgeBaseDropdown } from './add-knowledge-base-dropdown';
import { AddRow } from './add-row';

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
            'group flex items-center gap-2 px-3 py-1 cursor-pointer rounded-full border bg-gray-3/50',
            disabled && 'opacity-50 pointer-events-none',
          )}
        >
          {tool.sourceType === KnowledgeBaseSourceType.FILE ? (
            <FileText className="size-3.5 text-gray-11 shrink-0" />
          ) : (
            <Table2 className="size-3.5 text-gray-11 shrink-0" />
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
                  text-gray-11
                  hover:text-danger-11
                  hover:bg-danger-3
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

export function NoEmbeddingSourceNote({
  className,
  isError = false,
  onRetry,
}: {
  className?: string;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const isAdmin = useIsPlatformAdmin();
  if (isError) {
    return (
      <p className={className}>
        {t("Couldn't check whether files can be indexed.")}{' '}
        <button
          type="button"
          className="font-medium text-gray-12 underline underline-offset-2"
          onClick={onRetry}
        >
          {t('Retry')}
        </button>
      </p>
    );
  }
  return (
    <p className={className}>
      {t('No AI key can index files for this project yet.')}{' '}
      {isAdmin ? (
        <Link
          to="/platform/ai/capabilities"
          className="font-medium text-gray-12 underline underline-offset-2"
        >
          {t('Pick an embedding model')}
        </Link>
      ) : (
        t('Ask your admin to set an Embeddings model.')
      )}
    </p>
  );
}

export const KnowledgeBaseSection = ({
  disabled,
  tools,
  allTools,
  removeTool,
  onToolsUpdate,
  layout = 'card',
}: KnowledgeBaseSectionProps) => {
  const {
    data: embeddingSource,
    isError: embeddingSourceFailed,
    refetch: retryEmbeddingSource,
  } = useKnowledgeBaseEmbeddingSource();
  const supportsEmbeddings = !isNil(embeddingSource?.provider);
  const { data: pgvectorAvailable } = flagsHooks.useFlag<boolean>(
    ApFlagId.PGVECTOR_AVAILABLE,
  );

  if (pgvectorAvailable === false) {
    return null;
  }

  const asRows = layout === 'rows';

  return (
    <div className={cn(!asRows && 'mt-6')}>
      {!asRows && (
        <h2 className="text-sm font-medium">{t('Knowledge Base')}</h2>
      )}

      <div className={cn(!asRows && 'mt-2')}>
        {tools.length > 0 ? (
          <div
            className={cn(
              'overflow-hidden',
              asRows ? 'rounded-lg border p-3' : 'border rounded-md p-4',
            )}
          >
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
              <NoEmbeddingSourceNote
                className="text-xs text-gray-11 mt-3"
                isError={embeddingSourceFailed}
                onRetry={() => retryEmbeddingSource().catch(() => undefined)}
              />
            )}
          </div>
        ) : asRows ? (
          supportsEmbeddings ? (
            <AddKnowledgeBaseDropdown disabled={disabled}>
              <AddRow label={t('Add knowledge')} disabled={disabled} />
            </AddKnowledgeBaseDropdown>
          ) : (
            <NoEmbeddingSourceNote
              className="text-xs leading-4 text-gray-11"
              isError={embeddingSourceFailed}
              onRetry={() => retryEmbeddingSource().catch(() => undefined)}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-panel px-4 py-8 text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-full border bg-gray-1">
              <BookOpen className="size-5" />
            </div>
            {supportsEmbeddings ? (
              <>
                <p className="text-sm font-medium text-gray-11">
                  {t(
                    'Add files or tables as knowledge sources for your agent.',
                  )}
                </p>
                <AddKnowledgeBaseDropdown disabled={disabled} />
              </>
            ) : (
              <NoEmbeddingSourceNote
                className="text-sm text-gray-11"
                isError={embeddingSourceFailed}
                onRetry={() => retryEmbeddingSource().catch(() => undefined)}
              />
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
  layout?: 'card' | 'rows';
  tools: AgentKnowledgeBaseTool[];
  allTools: AgentTool[];
  removeTool: (toolName: string) => void;
  onToolsUpdate: (tools: AgentTool[]) => void;
};
