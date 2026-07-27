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
