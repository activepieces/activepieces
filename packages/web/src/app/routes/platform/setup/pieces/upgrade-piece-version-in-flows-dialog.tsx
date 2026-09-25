import { BulkUpgradePieceVersionResponse } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUpCircle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  changeVersionUtils,
  VersionChangeType,
} from '@/app/builder/step-settings/update-piece-version-dialog/update-piece-version-utils';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesApi, piecesHooks } from '@/features/pieces';

type UpgradePieceVersionInFlowsDialogProps = {
  pieceName: string;
  pieceDisplayName: string;
  installedVersion: string;
  isEnabled: boolean;
};

const UpgradeDialogContent = ({
  pieceName,
  pieceDisplayName,
  installedVersion,
  onClose,
}: {
  pieceName: string;
  pieceDisplayName: string;
  installedVersion: string;
  onClose: () => void;
}) => {
  const { pieceVersions, isLoading: isLoadingVersions } =
    piecesHooks.usePieceVersions(pieceName);
  const [targetVersion, setTargetVersion] = useState(installedVersion);

  const { data: preview, isFetching: isPreviewing } = useQuery({
    queryKey: ['bulk-upgrade-preview', pieceName, targetVersion],
    queryFn: () =>
      piecesApi.bulkUpgradeVersion({
        pieceName,
        targetVersion,
        dryRun: true,
      }),
    enabled: !!targetVersion,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      piecesApi.bulkUpgradeVersion({ pieceName, targetVersion, dryRun: false }),
    onSuccess: (result: BulkUpgradePieceVersionResponse) => {
      toast.success(
        t('upgradedFlowsCount', { count: result.autoUpgradeable.length }),
      );
      onClose();
    },
    onError: () => {
      toast.error(t('Failed to upgrade flows. Please try again.'));
    },
  });

  const isMinorOrMajor =
    changeVersionUtils.getVersionChangeType({
      currentVersion: installedVersion,
      selectedVersion: targetVersion,
    }) === VersionChangeType.MINOR_OR_MAJOR;

  const autoCount = preview?.autoUpgradeable.length ?? 0;
  const manualCount = preview?.needsManual.length ?? 0;
  const nothingToDo = !isPreviewing && autoCount === 0 && manualCount === 0;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {t('Upgrade flows using {name}', { name: pieceDisplayName })}
        </DialogTitle>
        <DialogDescription>
          {t(
            'Set every flow that pins an older version to the version below. Flows whose settings still fit are republished automatically; flows that need new configuration are listed for you to update manually.',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Select
          value={targetVersion}
          onValueChange={setTargetVersion}
          disabled={isLoadingVersions}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select a version')} />
          </SelectTrigger>
          <SelectContent>
            {(pieceVersions ?? []).map((entry) => (
              <SelectItem key={entry.version} value={entry.version}>
                v{entry.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isMinorOrMajor && (
          <Alert variant="warning">
            <TriangleAlert className="size-4" />
            <AlertDescription>{t('MajorUpgradeNote')}</AlertDescription>
          </Alert>
        )}

        {isPreviewing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner className="size-4" />
            {t('Checking which flows are affected...')}
          </div>
        ) : nothingToDo ? (
          <p className="text-sm text-muted-foreground">
            {t('No flows pin an older version of this piece.')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {t('autoUpgradeableFlowsCount', { count: autoCount })}
            </p>
            {manualCount > 0 && (
              <Alert variant="warning">
                <TriangleAlert className="size-4" />
                <AlertTitle>
                  {t('manualUpgradeFlowsCount', { count: manualCount })}
                </AlertTitle>
                <AlertDescription>
                  <ScrollArea className="max-h-40">
                    <ul className="list-disc pl-4">
                      {preview?.needsManual.map((flow) => (
                        <li key={flow.flowId}>
                          {flow.flowName} (
                          {flow.currentVersions.map((v) => `v${v}`).join(', ')})
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={applyMutation.isPending}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          loading={applyMutation.isPending}
          disabled={isPreviewing || autoCount === 0}
          onClick={() => applyMutation.mutate()}
        >
          {t('upgradeFlowsButton', { count: autoCount })}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const UpgradePieceVersionInFlowsDialog = ({
  pieceName,
  pieceDisplayName,
  installedVersion,
  isEnabled,
}: UpgradePieceVersionInFlowsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={!isEnabled}>
              <ArrowUpCircle className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('Upgrade flows to a version')}</TooltipContent>
      </Tooltip>
      {open && (
        <UpgradeDialogContent
          key={pieceName}
          pieceName={pieceName}
          pieceDisplayName={pieceDisplayName}
          installedVersion={installedVersion}
          onClose={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
};

UpgradePieceVersionInFlowsDialog.displayName =
  'UpgradePieceVersionInFlowsDialog';

export { UpgradePieceVersionInFlowsDialog };
