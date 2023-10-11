import {
  ActionType,
  PackageType,
  PieceType,
  UpdateActionRequest,
} from '@activepieces/shared';
import { FlowItemDetails } from '@activepieces/ui/common';

export function constructUpdateOperation(
  flowItemDetails: FlowItemDetails,
  stepName: string,
  stepDisplayName: string,
  helloWorldBase64: string
): UpdateActionRequest {
  const defaultProps = {
    displayName: stepDisplayName,
    name: stepName,
  };

  switch (flowItemDetails.type) {
    case ActionType.BRANCH: {
      return {
        ...defaultProps,
        settings: {
          conditions: [
            [
              {
                firstValue: '',
                secondValue: '',
                operator: undefined,
              },
            ],
          ],
          inputUiInfo: {},
        },
        type: ActionType.BRANCH,
        valid: false,
      };
    }
    case ActionType.CODE: {
      return {
        ...defaultProps,
        settings: {
          artifact: helloWorldBase64,
          artifactSourceId: '',
          input: {},
        },
        type: ActionType.CODE,
        valid: true,
      };
    }
    case ActionType.LOOP_ON_ITEMS: {
      return {
        ...defaultProps,
        type: ActionType.LOOP_ON_ITEMS,
        settings: {
          items: '',
        },
        valid: false,
      };
    }
    case ActionType.PIECE: {
      return {
        ...defaultProps,
        type: ActionType.PIECE,
        valid: false,
        settings: {
          packageType:
            flowItemDetails.extra?.packageType ?? PackageType.REGISTRY,
          pieceType: flowItemDetails.extra?.pieceType ?? PieceType.OFFICIAL,
          pieceName: flowItemDetails.extra?.pieceName ?? 'NO_APP_NAME',
          pieceVersion: flowItemDetails.extra?.pieceVersion ?? 'NO_APP_VERSION',
          pieceArchiveId: flowItemDetails.extra?.pieceArchiveId,
          actionName: undefined,
          input: {},
          inputUiInfo: {
            customizedInputs: {},
          },
        },
      };
    }
    default: {
      throw new Error(
        'flow item detail chosen cannot replace missing step: ' +
          JSON.stringify(flowItemDetails)
      );
    }
  }
}
