import { Alert02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
    <HugeiconsIcon icon={Alert02Icon} className="size-4" />
    <AlertTitle>{t('Piece not available')}</AlertTitle>
    <AlertDescription>
      {t('pieceNotAvailableOnInstanceNote', {
        pieceName,
        pieceVersion,
      })}
    </AlertDescription>
  </Alert>
);
