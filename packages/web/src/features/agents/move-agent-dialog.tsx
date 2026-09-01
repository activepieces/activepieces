import {
  AgentMoveLoss,
  AgentMoveLossKind,
  AgentMovePreview,
} from '@activepieces/shared';
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
  const targetProject = elsewhere.find(
    (project) => project.id === targetProjectId,
  );

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
          project:
            targetProject === undefined
              ? t('another project')
              : getProjectName(targetProject),
        }),
      );
      onOpenChange(false);
      onMoved?.(moved.projectId);
    },
  });

  const blockedByFlows = (preview?.blockedByPublishedFlows.total ?? 0) > 0;
  const somethingIsLost =
    (preview?.toolsThatStopWorking.length ?? 0) > 0 ||
    (preview?.membersLosingAccess ?? 0) > 0;
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
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>
              {describeUsage(preview?.blockedByPublishedFlows)}
            </AlertDescription>
          </Alert>
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
        {targetProject !== undefined && (
          <MoveConsequences
            preview={preview}
            checking={checking}
            checkFailed={checkFailed}
            projectName={getProjectName(targetProject)}
          />
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
            {somethingIsLost ? t('Move anyway') : t('Move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MoveConsequences = ({
  preview,
  checking,
  checkFailed,
  projectName,
}: {
  preview?: AgentMovePreview;
  checking: boolean;
  checkFailed: boolean;
  projectName: string;
}) => {
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: (preview?.toolsThatStopWorking ?? [])
      .filter((loss) => loss.kind === AgentMoveLossKind.CONNECTION)
      .map((loss) => loss.label),
  });

  if (checkFailed) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertDescription>
          {t("Couldn't check what this move affects. Try again.")}
        </AlertDescription>
      </Alert>
    );
  }
  if (checking || preview === undefined) {
    return (
      <p className="text-[13px] leading-4 text-muted-foreground">
        {t('Checking what this move affects…')}
      </p>
    );
  }
  if (!preview.mayCreateAgentsThere) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertDescription>
          {t('Your role in {project} cannot create agents there.', {
            project: projectName,
          })}
        </AlertDescription>
      </Alert>
    );
  }

  const lines = [
    ...lossLine({
      losses: preview.toolsThatStopWorking,
      kind: AgentMoveLossKind.CONNECTION,
      messageKey: 'agentMoveLosesConnections',
      project: projectName,
      rename: (label) =>
        summaries.find((summary) => summary.name === label)?.displayName ??
        label,
    }),
    ...lossLine({
      losses: preview.toolsThatStopWorking,
      kind: AgentMoveLossKind.FLOW,
      messageKey: 'agentMoveLosesFlows',
      project: projectName,
    }),
    ...lossLine({
      losses: preview.toolsThatStopWorking,
      kind: AgentMoveLossKind.KNOWLEDGE,
      messageKey: 'agentMoveLosesKnowledge',
      project: projectName,
    }),
    ...(preview.membersLosingAccess > 0
      ? [
          t('agentMoveLosesMembers', {
            count: preview.membersLosingAccess,
            project: projectName,
          }),
        ]
      : []),
  ];

  if (lines.length === 0) {
    return (
      <p className="text-[13px] leading-4 text-muted-foreground">
        {t('agentMoveNothingBreaks', { project: projectName })}
      </p>
    );
  }

  return (
    <Alert variant="warning">
      <TriangleAlert />
      <AlertDescription className="flex flex-col gap-1.5">
        {lines.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
        <span>
          {t('agentMoveUsesTargetAccounts', { project: projectName })}
        </span>
      </AlertDescription>
    </Alert>
  );
};

function lossLine({
  losses,
  kind,
  messageKey,
  project,
  rename = (label) => label,
}: {
  losses: AgentMoveLoss[];
  kind: AgentMoveLossKind;
  messageKey: string;
  project: string;
  rename?: (label: string) => string;
}): string[] {
  const named = losses
    .filter((loss) => loss.kind === kind)
    .map((loss) => rename(loss.label));
  if (named.length === 0) {
    return [];
  }
  const shown = named.slice(0, MAX_NAMED_LOSSES);
  const listed =
    named.length > shown.length
      ? t('agentMoveAndMore', {
          names: shown.join(', '),
          count: named.length - shown.length,
        })
      : shown.join(', ');
  return [t(messageKey, { count: named.length, names: listed, project })];
}

type MoveAgentDialogProps = {
  agent: { id: string; displayName: string; projectId: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: (projectId: string) => void;
};
