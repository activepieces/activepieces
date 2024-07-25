import {
  ActionType,
  PopulatedFlow,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';

import { ExtraPiecesCircle } from './extra-pieces-circle';
import { PieceIcon } from './piece-icon';

export function PieceIconList({ flow }: { flow: PopulatedFlow }) {
  const steps = flowHelper
    .getAllSteps(flow.version.trigger)
    .map((step) => {
      if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) {
        return step.settings.pieceName;
      }
      return null;
    })
    .filter((pieceName): pieceName is string => pieceName !== null);

  const visibleSteps = steps.slice(0, 2);
  const extraStepsCount = steps.length - visibleSteps.length;
  const extraSteps = steps.slice(2);

  return (
    <div className="flex gap-2">
      {visibleSteps.map((pieceName, index) => (
        <PieceIcon
          circle={true}
          size={'md'}
          border={true}
          pieceName={pieceName}
          key={index}
        />
      ))}
      {extraStepsCount > 0 && (
        <ExtraPiecesCircle
          extraStepsCount={extraStepsCount}
          pieces={extraSteps}
        />
      )}
    </div>
  );
}
