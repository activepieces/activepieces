import {
  AppConnectionReplaceScope,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  ReplaceConnectionSelection,
  ReplaceConnectionSelectionFields,
  replaceConnectionSelectionUtils,
  ReplaceConnectionVersionsField,
} from '@/app/connections/replace-connection-selection-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { internalErrorToast } from '@/components/ui/sonner';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { piecesHooks } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';

const ReplaceConnectionForFlowDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('Replace connection')}</DialogTitle>
          <DialogDescription>
            {t(
              'Switch the steps of this flow from one connection to another. Other flows are not changed.',
            )}
          </DialogDescription>
        </DialogHeader>
        <ReplaceConnectionForFlowForm
          key={dialogOpen ? 'open' : 'closed'}
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

function ReplaceConnectionForFlowForm({
  setDialogOpen,
}: {
  setDialogOpen: (open: boolean) => void;
}) {
  const [flow, flowVersion, setFlow, setVersion] = useBuilderStateContext(
    (state) => [state.flow, state.flowVersion, state.setFlow, state.setVersion],
  );
  const projectId = authenticationSession.getProjectId()!;
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
      refetch: () => {
        flowsApi
          .get(flow.id)
          .then((updatedFlow) => {
            setFlow(updatedFlow);
            setVersion(updatedFlow.version);
          })
          .catch(() => internalErrorToast());
      },
    });
  const form = useForm<FlowReplaceFormValues>({
    defaultValues: {
      ...replaceConnectionSelectionUtils.emptySelection(),
      applyToPublishedVersions: false,
    },
    mode: 'onSubmit',
  });

  const projectConnections = connections?.data ?? [];
  const flowConnectionExternalIds = [
    ...flowStructureUtil.extractConnectionIds(flowVersion),
    ...flowStructureUtil.extractAgentToolConnectionIds(flowVersion),
  ];
  const flowConnections = projectConnections.filter((connection) =>
    flowConnectionExternalIds.includes(connection.externalId),
  );
  const flowPieceNames = new Set(
    flowConnections.map((connection) => connection.pieceName),
  );
  const flowPieces =
    pieces?.filter((piece) => flowPieceNames.has(piece.name)) ?? [];

  const handleSubmit = (values: FlowReplaceFormValues) => {
    replaceConnections({
      scope: AppConnectionReplaceScope.FLOW,
      flowIds: [flow.id],
      projectId,
      sourceAppConnectionId: values.sourceConnectionId,
      targetAppConnectionId: values.targetConnectionId,
      applyToPublishedVersions: values.applyToPublishedVersions,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <ReplaceConnectionSelectionFields
          pieces={flowPieces}
          sourceConnections={flowConnections}
          targetConnections={projectConnections}
          loading={piecesLoading || connectionsLoading}
        />
        <ReplaceConnectionVersionsField />
        <Alert variant="warning">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            {t(
              'Inputs that depend on this connection keep their values, make sure you test the flow before you publish',
            )}
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isReplacing}>
            {t('Replace')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

ReplaceConnectionForFlowDialog.displayName = 'ReplaceConnectionForFlowDialog';
export { ReplaceConnectionForFlowDialog };

type FlowReplaceFormValues = ReplaceConnectionSelection & {
  applyToPublishedVersions: boolean;
};
