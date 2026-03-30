import {
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
  isNil,
  PieceAction,
  PieceTrigger,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { pieceSelectorUtils, piecesApi } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  LatestVersionAvailableAlert,
  pieceStepVersionBackupExpiredMessageKey,
  RevertVersionCollapsible,
  useRevertPieceVersionUpdateMutation,
  VersionChangeType,
} from './update-piece-version-utils';

export const UpgradePieceVersionContent: React.FC<
  UpgradePieceVersionContentProps
> = ({
  step,
  currentVersion,
  latestVersion,
  isLatestMinorOrMajor,
  onClose,
  onOpenAdvanced,
}) => {
  const pieceName = step.settings.pieceName;
  const actionOrTriggerName =
    step.type === FlowTriggerType.PIECE
      ? step.settings.triggerName ?? ''
      : step.settings.actionName ?? '';
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const pieceStepVersionBackup =
    flowVersion.pieceStepsVersionsBackups?.[step.name];
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );
  const waitForPendingFlowUpdates = useBuilderStateContext(
    (state) => state.waitForPendingFlowUpdates,
  );

  const { mutate: applyUpgrade, isPending: isUpgradePending } = useMutation({
    mutationFn: async () => {
      const piece = await piecesApi.get({
        name: pieceName,
        version: latestVersion,
      });
      const changeType = changeVersionUtils.getVersionChangeType({
        currentVersion,
        selectedVersion: latestVersion,
      });

      const actionOrTriggerDef =
        step.type === FlowTriggerType.PIECE
          ? piece.triggers[actionOrTriggerName]
          : piece.actions[actionOrTriggerName];

      if (isNil(actionOrTriggerDef)) {
        throw new Error(
          t(
            'The selected version does not include the current action or trigger. Please choose a different version.',
          ),
        );
      }

      const input = changeVersionUtils.getInputAfterVersionChange({
        versionChangeType: changeType,
        props: actionOrTriggerDef.props,
        currentInput: step.settings.input,
      });

      const valid = pieceSelectorUtils.isPieceStepInputValid({
        props: actionOrTriggerDef.props,
        auth: piece.auth,
        input,
        requireAuth: actionOrTriggerDef.requireAuth,
      });

      if (changeType === VersionChangeType.MINOR_OR_MAJOR) {
        await waitForPendingFlowUpdates();
        applyOperation({
          type: FlowOperationType.CREATE_PIECE_VERSION_UPDATE_BACKUP,
          request: { stepName: step.name },
        });
      }

      if (step.type === FlowTriggerType.PIECE) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            ...step,
            type: FlowTriggerType.PIECE,
            valid,
            settings: {
              ...step.settings,
              pieceVersion: latestVersion,
              input,
            },
          },
        });
      } else {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            ...step,
            type: FlowActionType.PIECE,
            valid,
            settings: {
              ...step.settings,
              pieceVersion: latestVersion,
              input,
            },
          },
        });
      }

      if (changeType === VersionChangeType.MINOR_OR_MAJOR) {
        applyOperation({
          type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
          request: {
            stepName: step.name,
            sampleDataSettings: undefined,
          },
        });
      }
    },
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      setServerError(error.message);
    },
  });

  const { mutate: revertVersionUpdate, isPending: isRevertPending } =
    useRevertPieceVersionUpdateMutation({
      stepName: step.name,
      onSuccess: () => {
        onClose();
      },
      onError: (message) => {
        const display =
          message === pieceStepVersionBackupExpiredMessageKey
            ? t(pieceStepVersionBackupExpiredMessageKey)
            : message;
        setServerError(display);
      },
    });

  return (
    <div className="flex flex-col gap-4">
      <LatestVersionAvailableAlert
        isLatestMinorOrMajor={isLatestMinorOrMajor}
      />

      {pieceStepVersionBackup && (
        <RevertVersionCollapsible
          backupPieceVersion={pieceStepVersionBackup.pieceVersion}
          onRevert={revertVersionUpdate}
          isRevertPending={isRevertPending}
          revertDisabled={isUpgradePending}
        />
      )}

      {serverError && (
        <p className="text-sm font-medium text-destructive">{serverError}</p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="mr-auto"
          onClick={onOpenAdvanced}
        >
          {t('Advanced')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          loading={isUpgradePending}
          disabled={isRevertPending}
          onClick={() => applyUpgrade()}
        >
          {isLatestMinorOrMajor
            ? t('Upgrade to v{version}', { version: latestVersion })
            : t('Update to v{version}', { version: latestVersion })}
        </Button>
      </DialogFooter>
    </div>
  );
};

export type UpgradePieceVersionContentProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
  latestVersion: string;
  isLatestMinorOrMajor: boolean;
  onClose: () => void;
  onOpenAdvanced: () => void;
};
