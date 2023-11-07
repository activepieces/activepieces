import { OperatorFunction, catchError, of } from 'rxjs';
import { PieceMetadataModel } from '@activepieces/ui/common';

export const returnEmptyRecordInCaseErrorOccurs: OperatorFunction<
  Record<string, { clientId: string }>,
  Record<string, { clientId: string }>
> = catchError((err) => {
  console.error(err);
  return of({} as Record<string, { clientId: string }>);
});

export function checkIfPieceHasAppWebhook(
  metaData: PieceMetadataModel,
  triggerName: string
) {
  let isTriggerAppWebhook = false;
  Object.keys(metaData.triggers).forEach((k) => {
    isTriggerAppWebhook =
      isTriggerAppWebhook ||
      (triggerName === k && metaData.triggers[k].type === 'APP_WEBHOOK');
  });
  return isTriggerAppWebhook;
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
