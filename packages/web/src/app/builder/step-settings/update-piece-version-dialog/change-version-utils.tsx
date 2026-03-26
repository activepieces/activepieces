import { OAuth2Props, PiecePropertyMap } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { AlertTriangle, ArrowUp, Info, RotateCcw } from 'lucide-react';
import semver from 'semver';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formUtils } from '@/features/pieces';

function getVersionChangeType({
  currentVersion,
  selectedVersion,
}: {
  currentVersion: string;
  selectedVersion: string;
}): VersionChangeType {
  if (currentVersion === selectedVersion)
    return VersionChangeType.PATCH_UPGRADE;

  const current = semver.parse(currentVersion);
  const selected = semver.parse(selectedVersion);
  if (!current || !selected) return VersionChangeType.MINOR_OR_MAJOR;

  if (current.major !== selected.major || current.minor !== selected.minor) {
    return VersionChangeType.MINOR_OR_MAJOR;
  }
  if (semver.lt(selectedVersion, currentVersion)) {
    return VersionChangeType.PATCH_DOWNGRADE;
  }
  return VersionChangeType.PATCH_UPGRADE;
}

function getLatestMinorOrMajorUpgrade({
  currentVersion,
  versions,
}: {
  currentVersion: string;
  versions: { version: string }[];
}): string | undefined {
  const latest = versions[0]?.version;
  if (!latest) return undefined;
  const changeType = getVersionChangeType({
    currentVersion,
    selectedVersion: latest,
  });
  if (
    changeType === VersionChangeType.MINOR_OR_MAJOR &&
    semver.gt(latest, currentVersion)
  ) {
    return latest;
  }
  return undefined;
}

function getInputAfterVersionChange({
  versionChangeType,
  props,
  currentInput,
}: {
  versionChangeType: VersionChangeType;
  props: PiecePropertyMap | OAuth2Props;
  currentInput: Record<string, unknown>;
}): Record<string, unknown> {
  if (versionChangeType === VersionChangeType.MINOR_OR_MAJOR) {
    return formUtils.getDefaultValueForProperties({
      props: { ...props },
      existingInput: {},
    });
  }
  if (versionChangeType === VersionChangeType.PATCH_DOWNGRADE) {
    return formUtils.getDefaultValueForProperties({
      props: { ...props },
      existingInput: currentInput,
    });
  }
  return currentInput;
}

function getLatestVersion({
  currentVersion,
  versions,
}: {
  currentVersion: string;
  versions: { version: string }[];
}): string | undefined {
  const latest = versions[0]?.version;
  if (!latest || !semver.gt(latest, currentVersion)) return undefined;
  return latest;
}

export function LatestVersionAvailableAlert({
  isLatestMinorOrMajor,
  latestVersion,
  onApplyLatestVersion,
  isApplyPending,
}: LatestVersionAvailableAlertProps) {
  return (
    <Alert
      layout="inlineAction"
      variant={isLatestMinorOrMajor ? 'warning' : 'default'}
    >
      {isLatestMinorOrMajor ? (
        <AlertTriangle className="size-4" />
      ) : (
        <ArrowUp className="size-4" />
      )}
      <AlertTitle>
        {isLatestMinorOrMajor
          ? t('Significant update available')
          : t('Newer version available')}
      </AlertTitle>
      <AlertDescription>
        {isLatestMinorOrMajor
          ? t(
              "Input will reset — you'll need to reconfigure. A backup will be saved so you can revert.",
            )
          : t(
              'Settings will carry over. Retest the step as the output may have changed.',
            )}
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="default"
          size="sm"
          loading={isApplyPending}
          onClick={() => onApplyLatestVersion({ version: latestVersion })}
        >
          {isLatestMinorOrMajor
            ? t('Upgrade to v{version}', { version: latestVersion })
            : t('Update to v{version}', { version: latestVersion })}
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function RevertVersionBackupAlert({
  backupPieceVersion,
  onRevert,
  isRevertPending,
}: RevertVersionBackupAlertProps) {
  return (
    <Alert layout="inlineAction" variant="primary">
      <RotateCcw className="size-4" />
      <AlertDescription>
        {t('Revert to restore your previous settings.')}
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={isRevertPending}
          onClick={() => onRevert()}
        >
          {t('Revert to v{version}', {
            version: backupPieceVersion,
          })}
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function MinorOrMajorSelectionAlert() {
  return (
    <Alert layout="inlineAction" variant="warning">
      <AlertTriangle className="size-4" />
      <AlertDescription>
        {t(
          "Settings won't carry over — you'll need to reconfigure and retest. A backup will be saved so you can revert.",
        )}
      </AlertDescription>
    </Alert>
  );
}

export function PatchUpgradeInfoAlert() {
  return (
    <Alert layout="inlineAction">
      <Info className="size-4" />
      <AlertDescription>
        {t('Settings will carry over. Retest as the output may have changed.')}
      </AlertDescription>
    </Alert>
  );
}

export function PatchDowngradeInfoAlert() {
  return (
    <Alert layout="inlineAction">
      <Info className="size-4" />
      <AlertDescription>
        {t(
          "You're switching to an older patch. Your settings will be kept where possible.",
        )}
      </AlertDescription>
    </Alert>
  );
}

export const changeVersionUtils = {
  getVersionChangeType,
  getInputAfterVersionChange,
  getLatestMinorOrMajorUpgrade,
  getLatestVersion,
};

export enum VersionChangeType {
  MINOR_OR_MAJOR = 'MINOR_OR_MAJOR',
  PATCH_DOWNGRADE = 'PATCH_DOWNGRADE',
  PATCH_UPGRADE = 'PATCH_UPGRADE',
}

type LatestVersionAvailableAlertProps = {
  isLatestMinorOrMajor: boolean;
  latestVersion: string;
  onApplyLatestVersion: (params: { version: string }) => void;
  isApplyPending: boolean;
};

type RevertVersionBackupAlertProps = {
  backupPieceVersion: string;
  onRevert: () => void;
  isRevertPending: boolean;
};
