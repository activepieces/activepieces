import { ActionType, TriggerType } from '@activepieces/shared';

export function getDisplayNameForTrigger(triggerType: TriggerType) {
  switch (triggerType) {
    case TriggerType.WEBHOOK: {
      return 'Webhook Trigger';
      break;
    }
    case TriggerType.EMPTY: {
      return 'Empty Trigger';
    }
  }
  return 'Trigger';
}

export function getDefaultDisplayNameForPiece(
  pieceType: ActionType,
  pieceName: string
) {
  switch (pieceType) {
    case ActionType.CODE: {
      return 'Code';
    }
    case ActionType.LOOP_ON_ITEMS: {
      return 'Loop on Items';
    }
    case ActionType.PIECE: {
      return pieceName;
    }
    case ActionType.BRANCH: {
      return 'Branch';
    }
  }
}

export function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}
