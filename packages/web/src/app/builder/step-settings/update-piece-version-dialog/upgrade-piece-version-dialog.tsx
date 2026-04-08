import { PieceAction, PieceTrigger } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  LatestVersionAvailableAlert,
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
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );

  const { mutate: applyUpgrade, isPending: isUpgradePending } = useMutation({
    mutationFn: async () => {
      await changeVersionUtils.applyPieceVersionChange({
        step,
        targetVersion: latestVersion,
        currentVersion,
        applyOperation,
      });
    },
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      setServerError(error.message);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <LatestVersionAvailableAlert
        isLatestMinorOrMajor={isLatestMinorOrMajor}
      />

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
