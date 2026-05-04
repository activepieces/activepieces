import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowPieceUtil,
} from '@activepieces/shared';
import { t } from 'i18next';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceStepMetadata, stepsHooks } from '@/features/pieces';

import { UpdatePieceVersionDialog } from './update-piece-version-dialog/update-piece-version-dialog';

type SettingsSubHeaderProps = {
  step: FlowAction | FlowTrigger;
};

const SettingsSubHeader = ({ step }: SettingsSubHeaderProps) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });
  const readonly = useBuilderStateContext((state) => state.readonly);

  const isPiece =
    stepMetadata?.type === FlowActionType.PIECE ||
    stepMetadata?.type === FlowTriggerType.PIECE;
  const pieceVersion = isPiece
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;
  const exactVersion = pieceVersion
    ? flowPieceUtil.getExactVersion(pieceVersion)
    : undefined;

  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('Settings')}
      </span>
      {exactVersion && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">v{exactVersion}</span>
          {!readonly &&
            isPiece &&
            (step.type === FlowActionType.PIECE ||
              step.type === FlowTriggerType.PIECE) && (
              <UpdatePieceVersionDialog
                step={step}
                currentVersion={exactVersion}
              />
            )}
        </div>
      )}
    </div>
  );
};

SettingsSubHeader.displayName = 'SettingsSubHeader';
export { SettingsSubHeader };
