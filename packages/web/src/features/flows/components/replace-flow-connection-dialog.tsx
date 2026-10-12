import { PopulatedFlow } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  appConnectionsQueries,
  ConnectionSearchableSelect,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type ReplaceFlowConnectionDialogProps = {
  flow: PopulatedFlow;
  children: React.ReactNode;
  onReplaced?: () => void;
};

const ReplaceFlowConnectionDialogContent = ({
  flow,
  onReplaced,
  onClose,
}: {
  flow: PopulatedFlow;
  onReplaced?: () => void;
  onClose: () => void;
}) => {
  const projectId = authenticationSession.getProjectId()!;
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [applyToPublishedVersions, setApplyToPublishedVersions] =
    useState(false);

  const { data: connections, isLoading } =
    appConnectionsQueries.useAppConnections({
      request: { projectId, limit: 1000 },
      extraKeys: [projectId],
      enabled: true,
    });

  const usedExternalIds = useMemo(
    () => new Set(flow.version.connectionIds),
    [flow.version.connectionIds],
  );

  const sourceConnections = useMemo(
    () =>
      (connections?.data ?? []).filter((connection) =>
        usedExternalIds.has(connection.externalId),
      ),
    [connections?.data, usedExternalIds],
  );

  const selectedSource = connections?.data.find(
    (connection) => connection.id === sourceId,
  );

  const targetConnections = useMemo(
    () =>
      (connections?.data ?? []).filter(
        (connection) =>
          connection.pieceName === selectedSource?.pieceName &&
          connection.id !== sourceId,
      ),
    [connections?.data, selectedSource?.pieceName, sourceId],
  );

  const { mutate: replace, isPending } = useMutation({
    mutationFn: () =>
      flowsApi.replaceConnection(flow.id, {
        sourceAppConnectionId: sourceId!,
        targetAppConnectionId: targetId!,
        applyToPublishedVersions,
      }),
    onSuccess: () => {
      toast.success(t('Connection replaced'));
      onReplaced?.();
      onClose();
    },
    onError: (error) => {
      toast.error(t('Error'), {
        description: api.isError(error)
          ? t('Failed to replace the connection')
          : undefined,
      });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Replace connection')}</DialogTitle>
        <DialogDescription>
          {t(
            'Switch this flow from one connection to another of the same app. Only the connection is changed, no other step settings.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>{t('Connection to replace')}</Label>
          <ConnectionSearchableSelect
            connections={sourceConnections}
            value={sourceId ?? undefined}
            loading={isLoading}
            placeholder={t('Choose connection to replace')}
            onChange={(value) => {
              setSourceId(value);
              setTargetId(null);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('Replaced With')}</Label>
          <ConnectionSearchableSelect
            connections={targetConnections}
            value={targetId ?? undefined}
            disabled={!sourceId}
            placeholder={t('Choose connection to replace with')}
            onChange={(value) => setTargetId(value)}
          />
        </div>
        {flow.publishedVersionId !== null && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="apply-to-published"
              checked={applyToPublishedVersions}
              onCheckedChange={(checked) =>
                setApplyToPublishedVersions(checked === true)
              }
            />
            <Label htmlFor="apply-to-published" className="font-normal">
              {t('Also update and republish the published version')}
            </Label>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} type="button">
          {t('Cancel')}
        </Button>
        <Button
          onClick={() => replace()}
          disabled={!sourceId || !targetId}
          loading={isPending}
        >
          {t('Replace')}
        </Button>
      </DialogFooter>
    </>
  );
};

export const ReplaceFlowConnectionDialog = ({
  flow,
  children,
  onReplaced,
}: ReplaceFlowConnectionDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <ReplaceFlowConnectionDialogContent
          key={open ? 'open' : 'closed'}
          flow={flow}
          onReplaced={onReplaced}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
