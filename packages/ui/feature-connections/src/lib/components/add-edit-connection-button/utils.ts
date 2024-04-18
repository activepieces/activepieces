import { OperatorFunction, catchError, of } from 'rxjs';
import { AppConnectionType } from '@activepieces/shared';
import { PieceMetadataModel } from '@activepieces/pieces-framework';

export type PieceOAuth2DetailsMap = {
  [pieceName: string]: {
    clientId: string;
    connectionType:
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2;
  };
};
export type PieceOAuth2DetailsValue = {
  clientId: string;
  connectionType:
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
};
export const handleErrorForGettingPiecesOAuth2Details: OperatorFunction<
  PieceOAuth2DetailsMap,
  PieceOAuth2DetailsMap
> = catchError((err) => {
  console.error(err);
  return of({} as PieceOAuth2DetailsMap);
});

export function checkIfTriggerIsAppWebhook(
  metaData: PieceMetadataModel,
  triggerName: string
) {
  return Object.values(metaData.triggers).reduce(
    (result, trigger) =>
      (trigger.name === triggerName && trigger.type === 'APP_WEBHOOK') ||
      result,
    false
  );
}

export function getConnectionNameFromInterpolatedString(
  interpolatedString: string
) {
  //eg. {{connections.google}}
  if (interpolatedString.includes('[')) {
    const result = interpolatedString.substring(`{{connections['`.length);
    return result.slice(0, result.length - 4);
  }
  const result = interpolatedString.substring(`{{connections.`.length);
  return result.slice(0, result.length - 4);
}
