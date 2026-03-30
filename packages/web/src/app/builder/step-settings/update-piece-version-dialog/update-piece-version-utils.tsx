import { OAuth2Props, PiecePropertyMap } from '@activepieces/pieces-framework';
import { ErrorCode, FlowOperationType } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import semver from 'semver';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { flowsApi } from '@/features/flows';
import { formUtils } from '@/features/pieces';
import { api } from '@/lib/api';

import { useBuilderStateContext } from '../../builder-hooks';

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
    </Alert>
  );
}

export function RevertVersionBackupAlert({
  backupPieceVersion,
  onRevert,
  isRevertPending,
  revertDisabled,
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
          disabled={revertDisabled}
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

export function RevertVersionCollapsible({
  backupPieceVersion,
  onRevert,
  isRevertPending,
  revertDisabled,
}: RevertVersionBackupAlertProps) {
  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group flex h-auto w-full items-center justify-between gap-2 !px-0 py-2 text-sm font-medium hover:bg-transparent hover:text-foreground"
        >
          {t('Restore previous version')}
          <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <RevertVersionBackupAlert
          backupPieceVersion={backupPieceVersion}
          onRevert={onRevert}
          isRevertPending={isRevertPending}
          revertDisabled={revertDisabled}
        />
      </CollapsibleContent>
    </Collapsible>
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

export function useRevertPieceVersionUpdateMutation({
  stepName,
  onSuccess,
  onError,
}: {
  stepName: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const [flowId, setVersion, applyOperation] = useBuilderStateContext((s) => [s.flow.id, s.setVersion, s.applyOperation]);

  const waitForPendingFlowUpdates = useBuilderStateContext(
    (s) => s.waitForPendingFlowUpdates,
  );

  return useMutation({
    mutationFn: async () => {
      await waitForPendingFlowUpdates();
      try {
        const result = await flowsApi.update(
          flowId,
          {
            type: FlowOperationType.REVERT_PIECE_VERSION_UPDATE,
            request: { stepName },
          },
          true,
        );
        setVersion(result.version, false);
        applyOperation({
          type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
          request: {
            stepName,
            sampleDataSettings: undefined,
          },
        });
      } catch (err: unknown) {
        if (api.isApError(err, ErrorCode.ENTITY_NOT_FOUND)) {
          throw new Error(pieceStepVersionBackupExpiredMessageKey);
        }
        throw err;
      }
    },
    onSuccess,
    onError: (error: unknown) => {
      const message =
        error instanceof Error &&
        error.message === pieceStepVersionBackupExpiredMessageKey
          ? pieceStepVersionBackupExpiredMessageKey
          : error instanceof Error
          ? error.message
          : String(error);
      onError?.(message);
    },
  });
}

export const pieceStepVersionBackupExpiredMessageKey =
  'pieceStepVersionBackupExpired';

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

type RevertVersionBackupAlertProps = {
  backupPieceVersion: string;
  onRevert: () => void;
  isRevertPending: boolean;
  revertDisabled?: boolean;
};
