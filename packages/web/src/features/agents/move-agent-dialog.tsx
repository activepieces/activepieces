import { AgentMoveLossKind, AgentMovePreview } from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { describeUsage } from '@/features/agents/delete-agent-dialog';
import {
  agentsMutations,
  agentsQueries,
} from '@/features/agents/hooks/agents-hooks';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { api } from '@/lib/api';

const MAX_NAMED_LOSSES = 2;
const LOSS_KEYS: Record<AgentMoveLossKind, string> = {
  [AgentMoveLossKind.CONNECTION]: 'agentMoveLosesConnections',
  [AgentMoveLossKind.FLOW]: 'agentMoveLosesFlows',
  [AgentMoveLossKind.KNOWLEDGE]: 'agentMoveLosesKnowledge',
};

export const MoveAgentDialog = ({
  agent,
  open,
  onOpenChange,
  onMoved,
}: MoveAgentDialogProps) => {
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const { data: allProjects } = projectCollectionUtils.useAll();
  const elsewhere = (allProjects ?? []).filter(
    (project) => project.id !== agent.projectId,
  );
  const target = elsewhere.find((project) => project.id === targetProjectId);
  const projectName = target === undefined ? '' : getProjectName(target);

  const {
    data: preview,
    isLoading: checking,
    isError: checkFailed,
  } = agentsQueries.useMovePreview({
    id: agent.id,
    targetProjectId,
    enabled: open,
  });
  const moveAgent = agentsMutations.useMoveAgent({
    id: agent.id,
    onSuccess: (moved) => {
      toast.success(
        t('Moved {name} to {project}', {
          name: moved.displayName,
          project: projectName,
        }),
      );
      onOpenChange(false);
      onMoved?.(moved.projectId);
    },
  });

  const blockedByFlows = (preview?.blockedByPublishedFlows.total ?? 0) > 0;
  const losses = useLossLines({ preview, projectName });
  const ready =
    preview !== undefined &&
    !checking &&
    !checkFailed &&
    !blockedByFlows &&
    preview.mayCreateAgentsThere;

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
            {t('Pick where this agent should live.')}
          </DialogDescription>
        </DialogHeader>
        {blockedByFlows && (
          <MoveAlert variant="destructive">
            {describeUsage(preview?.blockedByPublishedFlows)}
          </MoveAlert>
        )}
        <SearchableSelect
          value={targetProjectId ?? undefined}
          onChange={setTargetProjectId}
          disabled={blockedByFlows}
          options={elsewhere.map((project) => ({
            value: project.id,
            label: getProjectName(project),
          }))}
          placeholder={t('Search projects')}
        />
        {target !== undefined && checkFailed && (
          <MoveAlert variant="destructive">
            {t("Couldn't check what this move affects. Try again.")}
          </MoveAlert>
        )}
        {target !== undefined && !checkFailed && preview === undefined && (
          <p className="text-[13px] leading-4 text-muted-foreground">
            {t('Checking what this move affects…')}
          </p>
        )}
        {target !== undefined && preview?.mayCreateAgentsThere === false && (
          <MoveAlert variant="destructive">
            {t('Your role in {project} cannot create agents there.', {
              project: projectName,
            })}
          </MoveAlert>
        )}
        {preview?.mayCreateAgentsThere === true &&
          (losses.length === 0 ? (
            <p className="text-[13px] leading-4 text-muted-foreground">
              {t('agentMoveNothingBreaks', { project: projectName })}
            </p>
          ) : (
            <MoveAlert variant="warning">
              {[
                ...losses,
                t('agentMoveUsesTargetAccounts', { project: projectName }),
              ].map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </MoveAlert>
          ))}
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
            {losses.length > 0 ? t('Move anyway') : t('Move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoveAlert = ({
  variant,
  children,
}: {
  variant: 'destructive' | 'warning';
  children: React.ReactNode;
}) => (
  <Alert variant={variant}>
    <TriangleAlert />
    <AlertDescription className="flex flex-col gap-1.5">
      {children}
    </AlertDescription>
  </Alert>
);

const useLossLines = ({
  preview,
  projectName,
}: {
  preview?: AgentMovePreview;
  projectName: string;
}): string[] => {
  const losses = preview?.toolsThatStopWorking ?? [];
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: losses
      .filter((loss) => loss.kind === AgentMoveLossKind.CONNECTION)
      .map((loss) => loss.label),
  });

  const lines = Object.values(AgentMoveLossKind).flatMap((kind) => {
    const named = losses
      .filter((loss) => loss.kind === kind)
      .map(
        (loss) =>
          summaries.find((summary) => summary.name === loss.label)
            ?.displayName ?? loss.label,
      );
    if (named.length === 0) {
      return [];
    }
    const shown = named.slice(0, MAX_NAMED_LOSSES);
    return [
      t(LOSS_KEYS[kind], {
        count: named.length,
        project: projectName,
        names:
          named.length > shown.length
            ? t('agentMoveAndMore', {
                names: shown.join(', '),
                count: named.length - shown.length,
              })
            : shown.join(', '),
      }),
    ];
  });

  return (preview?.membersLosingAccess ?? 0) > 0
    ? [
        ...lines,
        t('agentMoveLosesMembers', {
          count: preview?.membersLosingAccess,
          project: projectName,
        }),
      ]
    : lines;
};

type MoveAgentDialogProps = {
  agent: { id: string; displayName: string; projectId: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: (projectId: string) => void;
};
