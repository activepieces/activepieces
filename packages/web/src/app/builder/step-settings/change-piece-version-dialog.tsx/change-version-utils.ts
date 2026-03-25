import { OAuth2Props, PiecePropertyMap } from '@activepieces/pieces-framework';
import semver from 'semver';

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

export const changeVersionUtils = {
  getVersionChangeType,
  getInputAfterVersionChange,
};

export enum VersionChangeType {
  MINOR_OR_MAJOR = 'MINOR_OR_MAJOR',
  PATCH_DOWNGRADE = 'PATCH_DOWNGRADE',
  PATCH_UPGRADE = 'PATCH_UPGRADE',
}
