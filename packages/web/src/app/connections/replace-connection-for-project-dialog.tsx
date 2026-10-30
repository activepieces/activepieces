import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, WorkflowIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

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
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { flowHooks } from '@/features/flows';
import { piecesHooks } from '@/features/pieces';

import { DeleteReplacedConnectionDialog } from './delete-replaced-connection-dialog';
import {
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
  const [connectionToDelete, setConnectionToDelete] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="flex flex-col">
          <ReplaceConnectionForProjectForm
            key={dialogOpen ? 'open' : 'closed'}
            projectId={projectId}
            onConnectionMerged={onConnectionMerged}
            onOfferToDeleteSource={setConnectionToDelete}
            setDialogOpen={setDialogOpen}
          />
        </DialogContent>
      </Dialog>
      {connectionToDelete && (
        <DeleteReplacedConnectionDialog
          connection={connectionToDelete}
          projectId={projectId}
          onClose={() => {
            setConnectionToDelete(null);
            onConnectionMerged();
          }}
        />
      )}
    </>
  );
};

function ReplaceConnectionForProjectForm({
  projectId,
  onConnectionMerged,
  onOfferToDeleteSource,
  setDialogOpen,
}: ReplaceConnectionForProjectFormProps) {
  const navigate = useNavigate();
  const publishNeedsApproval = flowApprovalsHooks.usePublishNeedsApproval();
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
      connections: connections?.data ?? [],
      refetch: () => {
        onConnectionMerged();
        if (sourceConnection && canDeleteSource) {
          onOfferToDeleteSource(sourceConnection);
        }
      },
    });

  const {
    mutate: fetchAffectedFlows,
    data: flowsUsingConnection,
    isPending: isFetchingAffectedFlows,
  } = flowHooks.useListFlowsUsingConnection({
    projectId,
    onSuccess: () => setStep(ProjectReplaceStep.REVIEW_AFFECTED_FLOWS),
  });

  const form = useForm<ProjectReplaceFormValues>({
    defaultValues: {
      ...replaceConnectionSelectionUtils.emptySelection(),
      applyToPublishedVersions: false,
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

  const sourceConnection = projectConnections.find(
    (connection) => connection.id === sourceConnectionId,
  );
  const draftFlows = flowsUsingConnection?.draftFlows ?? [];
  const publishedOnlyFlows = flowsUsingConnection?.publishedOnlyFlows ?? [];
  const affectedFlows = (
    applyToPublishedVersions
      ? [...draftFlows, ...publishedOnlyFlows]
      : draftFlows
  ).slice(0, MAX_FLOWS_PER_REPLACE);
  const canDeleteSource =
    !publishNeedsApproval &&
    sourceConnection?.scope === AppConnectionScope.PROJECT;

  const handleSubmit = (values: ProjectReplaceFormValues) => {
    if (step === ProjectReplaceStep.CHOOSE_CONNECTIONS) {
      if (sourceConnection) {
        fetchAffectedFlows(sourceConnection.externalId);
      }
      return;
    }
    replaceConnections({
      sourceAppConnectionId: values.sourceConnectionId,
      targetAppConnectionId: values.targetConnectionId,
      projectId,
      applyToPublishedVersions: values.applyToPublishedVersions,
      flowIds: affectedFlows.map((flow) => flow.id),
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
                    <ScrollArea
                      className="px-3 pb-3"
                      viewPortClassName="max-h-[250px]"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {affectedFlows.map((flow) => (
                          <Badge
                            key={flow.id}
                            variant="secondary"
                            className="max-w-[280px] cursor-pointer hover:bg-gray-3/70"
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
                            <span className="shrink-0 text-gray-11">
                              {versionsUsingConnectionLabel({
                                usedInDraft:
                                  flowsUsingConnection?.draftFlowIds.has(
                                    flow.id,
                                  ) ?? false,
                                usedInPublished:
                                  flowsUsingConnection?.publishedFlowIds.has(
                                    flow.id,
                                  ) ?? false,
                              })}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <ReplaceConnectionVersionsField />

              <span className="text-xs text-gray-11">
                {t('A replace changes up to {max} flows.', {
                  max: MAX_FLOWS_PER_REPLACE,
                })}
              </span>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    form.setValue('applyToPublishedVersions', false);
                    setStep(ProjectReplaceStep.CHOOSE_CONNECTIONS);
                  }}
                >
                  {t('Back')}
                </Button>
                <Button
                  type="submit"
                  loading={isReplacing}
                  disabled={affectedFlows.length === 0}
                >
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

function versionsUsingConnectionLabel({
  usedInDraft,
  usedInPublished,
}: {
  usedInDraft: boolean;
  usedInPublished: boolean;
}): string {
  if (usedInDraft && usedInPublished) {
    return t('Draft and published');
  }
  return usedInPublished ? t('Published') : t('Draft');
}

ReplaceConnectionForProjectDialog.displayName =
  'ReplaceConnectionForProjectDialog';
export { ReplaceConnectionForProjectDialog };

const MAX_FLOWS_PER_REPLACE = 200;

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
  onOfferToDeleteSource: (
    connection: AppConnectionWithoutSensitiveData,
  ) => void;
  setDialogOpen: (open: boolean) => void;
};

type ProjectReplaceFormValues = ReplaceConnectionSelection & {
  applyToPublishedVersions: boolean;
};

enum ProjectReplaceStep {
  CHOOSE_CONNECTIONS = 'CHOOSE_CONNECTIONS',
  REVIEW_AFFECTED_FLOWS = 'REVIEW_AFFECTED_FLOWS',
}
