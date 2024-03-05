import { ActionType, TriggerType } from '@activepieces/shared';

export function getDisplayNameForTrigger(triggerType: TriggerType) {
  switch (triggerType) {
    case TriggerType.EMPTY: {
      return $localize`Empty Trigger`;
    }
  }
  return $localize`Trigger`;
}

export function getDefaultDisplayNameForPiece(
  pieceType: ActionType,
  pieceName: string
) {
  switch (pieceType) {
    case ActionType.CODE: {
      return $localize`Code`;
    }
    case ActionType.LOOP_ON_ITEMS: {
      return $localize`Loop on Items`;
    }
    case ActionType.PIECE: {
      return pieceName;
    }
    case ActionType.BRANCH: {
      return $localize`Branch`;
    }
  }
}

export function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}
