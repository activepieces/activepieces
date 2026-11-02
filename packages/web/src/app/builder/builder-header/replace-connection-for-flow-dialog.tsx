import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import {
  ReplaceConnectionFlowVersionsField,
  ReplaceConnectionFlowVersionsSelection,
  ReplaceConnectionSelectionFields,
  ReplaceConnectionSourceKind,
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
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { PieceIconWithPieceName } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';

const ReplaceConnectionForFlowDialog = ({
  sourceConnection,
  open,
  onOpenChange,
}: ReplaceConnectionForFlowDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieceIconWithPieceName
              pieceName={sourceConnection.pieceName}
              size="sm"
              border={false}
            />
            {t('Replace {name}', { name: sourceConnection.displayName })}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Every step in this flow that uses {name} will switch to the connection you pick below.',
              { name: sourceConnection.displayName },
            )}
          </DialogDescription>
        </DialogHeader>
        <ReplaceConnectionForFlowForm
          key={open ? 'open' : 'closed'}
          sourceConnection={sourceConnection}
          setDialogOpen={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};

function ReplaceConnectionForFlowForm({
  sourceConnection,
  setDialogOpen,
}: {
  sourceConnection: AppConnectionWithoutSensitiveData;
  setDialogOpen: (open: boolean) => void;
}) {
  const [flow, savePendingEdits, showsNewestVersion] = useBuilderStateContext(
    (state) => [state.flow, state.savePendingEdits, state.showsNewestVersion],
  );
  const refreshDraft = flowCanvasHooks.useRefreshDraftAndMakeNewDraftEditable();
  const { switchToDraft } = flowCanvasHooks.useSwitchToDraft();
  const projectId = authenticationSession.getProjectId()!;
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
        if (showsNewestVersion()) {
          refreshDraft().catch(() => internalErrorToast());
          return;
        }
        switchToDraft();
      },
    });
  const { mutate: saveEditsThenReplace, isPending: isSaving } = useMutation({
    mutationFn: (_values: FlowReplaceFormValues) => savePendingEdits(),
    onSuccess: (_, values) =>
      replaceConnections({
        flowIds: [flow.id],
        projectId,
        sourceAppConnectionId: sourceConnection.id,
        targetAppConnectionId: values.targetConnectionId,
        applyToPublishedVersions: values.applyToPublishedVersions,
      }),
  });
  const form = useForm<FlowReplaceFormValues>({
    defaultValues: {
      targetConnectionId: '',
      applyToPublishedVersions: false,
    },
    mode: 'onSubmit',
  });

  const projectConnections = connections?.data ?? [];
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => saveEditsThenReplace(values))}
        className="flex flex-col gap-4"
      >
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            {t(
              'Test the flow after the replace to make sure every step still works.',
            )}
          </AlertDescription>
        </Alert>
        <ReplaceConnectionFlowVersionsField />
        <ReplaceConnectionSelectionFields
          source={{
            kind: ReplaceConnectionSourceKind.FIXED,
            connection: sourceConnection,
          }}
          targetConnections={projectConnections}
          loading={connectionsLoading}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" loading={isSaving || isReplacing}>
            {t('Replace')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

ReplaceConnectionForFlowDialog.displayName = 'ReplaceConnectionForFlowDialog';
export { ReplaceConnectionForFlowDialog };

type FlowReplaceFormValues = ReplaceConnectionFlowVersionsSelection & {
  targetConnectionId: string;
};

type ReplaceConnectionForFlowDialogProps = {
  sourceConnection: AppConnectionWithoutSensitiveData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
