import { AgentMovePreview } from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  agentsQueries,
  agentsMutations,
} from '@/features/agents/hooks/agents-hooks';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { api } from '@/lib/api';

export const MoveAgentDialog = ({
  agent,
  open,
  onOpenChange,
  onMoved,
}: MoveAgentDialogProps) => {
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const { data: allProjects } = projectCollectionUtils.useAll();
  const options = (allProjects ?? [])
    .filter((project) => project.id !== agent.projectId)
    .map((project) => ({ value: project.id, label: getProjectName(project) }));

  const { data: preview, isLoading: previewLoading } =
    agentsQueries.useMovePreview({
      id: agent.id,
      targetProjectId,
      enabled: open,
    });
  const moveAgent = agentsMutations.useMoveAgent({
    id: agent.id,
    onSuccess: (moved) => {
      toast.success(t('Moved {name}', { name: moved.displayName }));
      onOpenChange(false);
      onMoved?.(moved.projectId);
    },
  });

  const blocked = (preview?.blockedByPublishedFlows.total ?? 0) > 0;
  const ready = targetProjectId !== null && !previewLoading && !blocked;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTargetProjectId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('Move to another project')}</DialogTitle>
          <DialogDescription>
            {t(
              'The agent takes its instructions and tools with it, and answers in the new project from then on. Its connections resolve there, so any that only exist here stop working.',
            )}
          </DialogDescription>
        </DialogHeader>
        <SearchableSelect
          value={targetProjectId ?? undefined}
          onChange={setTargetProjectId}
          options={options}
          placeholder={t('Search projects')}
        />
        {targetProjectId !== null && preview !== undefined && (
          <MoveConsequences preview={preview} />
        )}
        {moveAgent.error !== null && (
          <p className="text-[13px] leading-4 text-destructive">
            {api.extractServerErrorMessage(
              moveAgent.error,
              t('That agent could not be moved.'),
            )}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!ready}
            loading={moveAgent.isPending}
            onClick={() => {
              if (targetProjectId === null) return;
              moveAgent.mutate({ projectId: targetProjectId });
            }}
          >
            {t('Move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoveConsequences = ({ preview }: { preview: AgentMovePreview }) => {
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: preview.toolsLosingConnection,
  });
  const appNames = preview.toolsLosingConnection.map(
    (pieceName) =>
      summaries.find((summary) => summary.name === pieceName)?.displayName ??
      pieceName,
  );
  const lines = [
    ...(preview.blockedByPublishedFlows.total > 0
      ? [
          preview.blockedByPublishedFlows.names.length > 0
            ? t('agentMoveBlockedNamed', {
                count: preview.blockedByPublishedFlows.total,
                flows: preview.blockedByPublishedFlows.names.join(', '),
              })
            : t('agentMoveBlockedUnnamed', {
                count: preview.blockedByPublishedFlows.total,
              }),
        ]
      : []),
    ...(preview.toolsLosingConnection.length > 0
      ? [
          t('agentMoveLosesConnections', {
            count: preview.toolsLosingConnection.length,
            apps: appNames.join(', '),
          }),
        ]
      : []),
    ...(preview.membersLosingAccess > 0
      ? [t('agentMoveLosesMembers', { count: preview.membersLosingAccess })]
      : []),
  ];

  if (lines.length === 0) {
    return (
      <p className="text-[13px] leading-4 text-muted-foreground">
        {t('Nothing breaks: every tool it uses is connected there too.')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-50 p-3">
      {lines.map((line) => (
        <p
          key={line}
          className="flex items-start gap-2 text-[13px] leading-4 text-warning-600"
        >
          <AlertTriangle size={14} className="mt-[1px] shrink-0" />
          {line}
        </p>
      ))}
    </div>
  );
};

type MoveAgentDialogProps = {
  agent: { id: string; displayName: string; projectId: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: (projectId: string) => void;
};
