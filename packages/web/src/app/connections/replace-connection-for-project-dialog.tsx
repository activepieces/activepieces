import { isNil } from '@activepieces/core-utils';
import {
  AppConnectionReplaceScope,
  AppConnectionScope,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, WorkflowIcon } from 'lucide-react';
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
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { piecesHooks } from '@/features/pieces';

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
  const navigate = useNavigate();
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
    mutate: fetchAffectedFlows,
    data: affectedFlowsPage,
    isPending: isFetchingAffectedFlows,
  } = useMutation({
    mutationFn: (externalId: string) =>
      flowsApi.list({
        projectId,
        connectionExternalIds: [externalId],
        cursor: undefined,
        limit: 1000,
      }),
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

  const affectedFlows = affectedFlowsPage?.data ?? [];
  const hasPublishedAffectedFlows = affectedFlows.some(
    (flow) => !isNil(flow.publishedVersionId),
  );
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
        fetchAffectedFlows(sourceConnection.externalId);
      }
      return;
    }
    const deleteBlockedByPublishedFlows =
      !values.applyToPublishedVersions && hasPublishedAffectedFlows;
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
                'Switch flows from one connection to another. Choose the connection to replace and the one to use instead.',
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
                <Button type="submit" loading={isFetchingAffectedFlows}>
                  {t('Next')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {affectedFlows.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-gray-11">
                  <WorkflowIcon className="w-4 h-4 shrink-0" />
                  {t('No flows use this connection yet')}
                </div>
              ) : (
                <Collapsible defaultOpen className="rounded-md border">
                  <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium">
                    <span>
                      {t('flowsUsingConnection', {
                        count: affectedFlows.length,
                      })}
                    </span>
                    <ChevronDown className="w-4 h-4 shrink-0 text-gray-11 transition-transform group-data-[state=closed]:-rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ScrollArea className="max-h-[140px] px-3 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {affectedFlows.map((flow) => (
                          <Badge
                            key={flow.id}
                            variant="secondary"
                            className="max-w-[200px] cursor-pointer hover:bg-gray-3/70"
                            onClick={() =>
                              navigate(
                                `/projects/${flow.projectId}/flows/${flow.id}`,
                              )
                            }
                          >
                            <WorkflowIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {flow.version.displayName}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <ReplaceConnectionVersionsField
                onValueChange={(applyToPublishedVersions) => {
                  if (!applyToPublishedVersions && hasPublishedAffectedFlows) {
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
                        'Keep the old connection to reuse it later, or delete it for good. Deleting is unavailable while published flows still use it — switch the option above to Draft and published first. Global connections can only be deleted from the platform admin page.',
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
                              hasPublishedAffectedFlows) ||
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

type ProjectReplaceFormValues = ReplaceConnectionSelection & {
  applyToPublishedVersions: boolean;
  deleteSourceConnection: boolean;
};

enum ProjectReplaceStep {
  CHOOSE_CONNECTIONS = 'CHOOSE_CONNECTIONS',
  REVIEW_AFFECTED_FLOWS = 'REVIEW_AFFECTED_FLOWS',
}
