import { t } from 'i18next';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { PieceIcon } from '../../../../features/pieces/components/piece-icon';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

type McpConnectionProps = {
  connection: AppConnectionWithoutSensitiveData;
  isUsed: boolean;
  isUpdating: boolean;
  pieceInfo: {
    displayName: string;
    logoUrl?: string;
  };
  onToggle: (connection: AppConnectionWithoutSensitiveData) => void;
};

export const McpConnection = ({
  connection,
  isUsed,
  isUpdating,
  pieceInfo,
  onToggle,
}: McpConnectionProps) => {
  return (
    <Card
      className={`overflow-hidden transition-all duration-200`}
    >
      <CardContent className="flex flex-row items-start justify-between p-4 gap-3">
        <div className="flex items-center space-x-3 min-w-0 py-2">
          <PieceIcon
            displayName={pieceInfo.displayName}
            logoUrl={pieceInfo.logoUrl}
            size="md"
            showTooltip={true}
            circle={true}
            border={true}
          />
          <div className="min-w-0">
            <h4 className="font-medium truncate">{connection.displayName}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {connection.pieceName}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => onToggle(connection)}
          loading={isUpdating}
          className={`shrink-0 min-w-[80px] ${
            isUsed ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'
          }`}
        >
          {isUsed ? t('Remove') : t('Use')}
        </Button>
      </CardContent>
    </Card>
  );
}; 