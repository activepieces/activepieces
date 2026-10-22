import { isNil } from '@activepieces/core-utils';
import {
  AppConnectionReplaceScope,
  AppConnectionScope,
  MAX_AGENT_PAGE_SIZE,
  Permission,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, ChevronDown, LucideIcon, WorkflowIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgentsAvailable } from '@/features/agents';
import { agentsApi } from '@/features/agents/api/agents';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { piecesHooks } from '@/features/pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';

import {
  LabelWithTooltip,
  ReplaceConnectionSelection,
  ReplaceConnectionSelectionFields,
  replaceConnectionSelectionUtils,
  ReplaceConnectionVersionsField,
} from './replace-connection-selection-form';

const ReplaceConnectionForProjectDialog = ({
  onConnectionMerged,
  children,
  projectId,
}: ReplaceConnectionForProjectDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col">
        <ReplaceConnectionForProjectForm
          key={dialogOpen ? 'open' : 'closed'}
          projectId={projectId}
          onConnectionMerged={onConnectionMerged}
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

function ReplaceConnectionForProjectForm({
  projectId,
  onConnectionMerged,
  setDialogOpen,
}: ReplaceConnectionForProjectFormProps) {
  const { checkAccess } = useAuthorization();
  const agentsAvailable = useAgentsAvailable();
  const canSeeAgents = agentsAvailable && checkAccess(Permission.READ_AGENT);
  const [step, setStep] = useState<ProjectReplaceStep>(
    ProjectReplaceStep.CHOOSE_CONNECTIONS,
  );
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});
  const { data: connections, isLoading: connectionsLoading } =
    appConnectionsQueries.useAppConnections({
      request: { projectId, limit: 1000 },
      extraKeys: [projectId],
      staleTime: 0,
    });

  const { mutate: replaceConnections, isPending: isReplacing } =
    appConnectionsMutations.useReplaceConnections({
      setDialogOpen,
      refetch: onConnectionMerged,
    });

  const {
    mutate: fetchAffectedItems,
    data: affectedItems,
    isPending: isFetchingAffectedItems,
  } = useMutation({
    mutationFn: async (externalId: string) => {
      const [flowsPage, agentsPage] = await Promise.all([
        flowsApi.list({
          projectId,
          connectionExternalIds: [externalId],
          cursor: undefined,
          limit: 1000,
        }),
        canSeeAgents
          ? agentsApi.list({
              projectId,
              connectionExternalIds: [externalId],
              limit: MAX_AGENT_PAGE_SIZE,
            })
          : null,
      ]);
      return { flows: flowsPage.data, agents: agentsPage?.data ?? [] };
    },
    onSuccess: () => setStep(ProjectReplaceStep.REVIEW_AFFECTED_FLOWS),
    onError: () => {
      toast.error(t('Error'), {
        description: t('Failed to get affected flows'),
      });
    },
  });

  const form = useForm<ProjectReplaceFormValues>({
    defaultValues: {
      ...replaceConnectionSelectionUtils.emptySelection(),
      applyToPublishedVersions: false,
      deleteSourceConnection: false,
    },
    mode: 'onSubmit',
  });
  const sourceConnectionId = useWatch({
    control: form.control,
    name: 'sourceConnectionId',
  });
  const applyToPublishedVersions = useWatch({
    control: form.control,
    name: 'applyToPublishedVersions',
  });

  const projectConnections = connections?.data ?? [];
  const connectionPieceNames = new Set(
    projectConnections.map((connection) => connection.pieceName),
  );
  const replaceablePieces =
    pieces?.filter(
      (piece) =>
        !PIECES_WITHOUT_REPLACE.includes(piece.name) &&
        connectionPieceNames.has(piece.name),
    ) ?? [];

  const affectedFlows = affectedItems?.flows ?? [];
  const affectedAgents = affectedItems?.agents ?? [];
  const hasPublishedAffectedItems =
    affectedFlows.some((flow) => !isNil(flow.publishedVersionId)) ||
    affectedAgents.some((agent) => agent.isPublished);
  const sourceIsGlobalConnection =
    projectConnections.find(
      (connection) => connection.id === sourceConnectionId,
    )?.scope === AppConnectionScope.PLATFORM;

  const handleSubmit = (values: ProjectReplaceFormValues) => {
    if (step === ProjectReplaceStep.CHOOSE_CONNECTIONS) {
      const sourceConnection = projectConnections.find(
        (connection) => connection.id === values.sourceConnectionId,
      );
      if (sourceConnection) {
        fetchAffectedItems(sourceConnection.externalId);
      }
      return;
    }
    const deleteBlockedByPublishedFlows =
      !values.applyToPublishedVersions && hasPublishedAffectedItems;
    replaceConnections({
      scope: AppConnectionReplaceScope.PROJECT,
      sourceAppConnectionId: values.sourceConnectionId,
      targetAppConnectionId: values.targetConnectionId,
      projectId,
      deleteSourceConnection:
        values.deleteSourceConnection &&
        !deleteBlockedByPublishedFlows &&
        !sourceIsGlobalConnection,
      applyToPublishedVersions: values.applyToPublishedVersions,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {step === ProjectReplaceStep.CHOOSE_CONNECTIONS
            ? t('Replace connection')
            : t('Review and confirm')}
        </DialogTitle>
        <DialogDescription>
          {step === ProjectReplaceStep.CHOOSE_CONNECTIONS
            ? t(
                'Switch flows and agents from one connection to another. Choose the connection to replace and the one to use instead.',
              )
            : t('Review what changes, then replace.')}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {step === ProjectReplaceStep.CHOOSE_CONNECTIONS ? (
            <>
              <ReplaceConnectionSelectionFields
                pieces={replaceablePieces}
                sourceConnections={projectConnections}
                targetConnections={projectConnections}
                loading={piecesLoading || connectionsLoading}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    {t('Cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isFetchingAffectedItems}>
                  {t('Next')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {affectedFlows.length === 0 && affectedAgents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-gray-11">
                  <WorkflowIcon className="w-4 h-4 shrink-0" />
                  {t('No flows or agents use this connection yet')}
                </div>
              ) : (
                <>
                  {affectedFlows.length > 0 && (
                    <AffectedItemsList
                      summary={t('flowsUsingConnection', {
                        count: affectedFlows.length,
                      })}
                      icon={WorkflowIcon}
                      items={affectedFlows.map((flow) => ({
                        id: flow.id,
                        name: flow.version.displayName,
                        path: `/projects/${flow.projectId}/flows/${flow.id}`,
                      }))}
                    />
                  )}
                  {affectedAgents.length > 0 && (
                    <AffectedItemsList
                      summary={t('agentsUsingConnection', {
                        count: affectedAgents.length,
                      })}
                      icon={Bot}
                      items={affectedAgents.map((agent) => ({
                        id: agent.id,
                        name: agent.displayName,
                        path: `/projects/${agent.projectId}/agents/${agent.id}`,
                      }))}
                    />
                  )}
                </>
              )}

              <ReplaceConnectionVersionsField
                onValueChange={(applyToPublishedVersions) => {
                  if (!applyToPublishedVersions && hasPublishedAffectedItems) {
                    form.setValue('deleteSourceConnection', false);
                  }
                }}
              />

              <FormField
                control={form.control}
                name="deleteSourceConnection"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <LabelWithTooltip
                      label={t('After replacing')}
                      tooltip={t(
                        'Keep the old connection to reuse it later, or delete it for good. Deleting is unavailable while published flows or agents still use it — switch the option above to Draft and published first. Global connections can only be deleted from the platform admin page.',
                      )}
                    />
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) =>
                        field.onChange(value === 'true')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">
                          {t('Keep the old connection')}
                        </SelectItem>
                        <SelectItem
                          value="true"
                          disabled={
                            (!applyToPublishedVersions &&
                              hasPublishedAffectedItems) ||
                            sourceIsGlobalConnection
                          }
                        >
                          {t('Delete the old connection')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(ProjectReplaceStep.CHOOSE_CONNECTIONS)}
                >
                  {t('Back')}
                </Button>
                <Button type="submit" loading={isReplacing}>
                  {t('Replace')}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </Form>
    </>
  );
}

function AffectedItemsList({
  summary,
  icon: Icon,
  items,
}: AffectedItemsListProps) {
  const navigate = useNavigate();
  return (
    <Collapsible defaultOpen className="rounded-md border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium">
        <span>{summary}</span>
        <ChevronDown className="w-4 h-4 shrink-0 text-gray-11 transition-transform group-data-[state=closed]:-rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="max-h-[140px] px-3 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="max-w-[200px] cursor-pointer hover:bg-gray-3/70"
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

ReplaceConnectionForProjectDialog.displayName =
  'ReplaceConnectionForProjectDialog';
export { ReplaceConnectionForProjectDialog };

const PIECES_WITHOUT_REPLACE = [
  '@activepieces/piece-mcp',
  '@activepieces/piece-webhook',
];

type ReplaceConnectionForProjectDialogProps = {
  onConnectionMerged: () => void;
  children: React.ReactNode;
  projectId: string;
};

type ReplaceConnectionForProjectFormProps = {
  projectId: string;
  onConnectionMerged: () => void;
  setDialogOpen: (open: boolean) => void;
};

type AffectedItemsListProps = {
  summary: string;
  icon: LucideIcon;
  items: { id: string; name: string; path: string }[];
};

type ProjectReplaceFormValues = ReplaceConnectionSelection & {
  applyToPublishedVersions: boolean;
  deleteSourceConnection: boolean;
};

enum ProjectReplaceStep {
  CHOOSE_CONNECTIONS = 'CHOOSE_CONNECTIONS',
  REVIEW_AFFECTED_FLOWS = 'REVIEW_AFFECTED_FLOWS',
}
