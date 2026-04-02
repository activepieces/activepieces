import { OAuth2Props, PiecePropertyMap } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { AlertTriangle, ArrowUp, Info } from 'lucide-react';
import semver from 'semver';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
}: LatestVersionAvailableAlertProps) {
  return (
    <Alert variant={isLatestMinorOrMajor ? 'warning' : 'default'}>
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
          ? t('MajorUpgradeNote')
          : t(
              'Settings will carry over. Retest the step as the output may have changed.',
            )}
      </AlertDescription>
    </Alert>
  );
}

export function MinorOrMajorSelectionAlert() {
  return (
    <Alert variant="warning">
      <AlertTriangle className="size-4" />
      <AlertDescription>
        {t('MajorUpgradeNote')}
      </AlertDescription>
    </Alert>
  );
}

export function PatchUpgradeInfoAlert() {
  return (
    <Alert>
      <Info className="size-4" />
      <AlertDescription>
        {t('Settings will carry over. Retest as the output may have changed.')}
      </AlertDescription>
    </Alert>
  );
}

export function PatchDowngradeInfoAlert() {
  return (
    <Alert>
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
};
