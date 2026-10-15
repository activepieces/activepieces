import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PieceNotAvailableAlertProps = {
  pieceName: string;
  pieceVersion: string;
};

export const PieceNotAvailableAlert = ({
  pieceName,
  pieceVersion,
}: PieceNotAvailableAlertProps) => (
  <Alert variant="destructive">
    <AlertTriangle className="size-4" />
    <AlertTitle>{t('Piece not available')}</AlertTitle>
    <AlertDescription>
      {t('pieceNotAvailableOnInstanceNote', {
        pieceName,
        pieceVersion,
      })}
    </AlertDescription>
  </Alert>
);

export const ActionNotAvailableAlert = ({
  actionName,
  pieceName,
}: ActionNotAvailableAlertProps) => (
  <Alert variant="destructive">
    <AlertTriangle className="size-4" />
    <AlertTitle>{t('Action not available')}</AlertTitle>
    <AlertDescription>
      {t('actionNotAvailableInFlowsNote', { actionName, pieceName })}
    </AlertDescription>
  </Alert>
);

type ActionNotAvailableAlertProps = {
  actionName: string;
  pieceName: string;
};
