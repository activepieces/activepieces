import { Trash2 } from 'lucide-react';

import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { PieceIcon } from '../../../../features/pieces/components/piece-icon';

type McpConnectionProps = {
  connection: AppConnectionWithoutSensitiveData;
  isUpdating: boolean;
  pieceInfo: {
    displayName: string;
    logoUrl?: string;
  };
  onDelete: (connection: AppConnectionWithoutSensitiveData) => void;
};

export const McpConnection = ({
  connection,
  isUpdating,
  pieceInfo,
  onDelete,
}: McpConnectionProps) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 relative`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(connection)}
        loading={isUpdating}
        className="absolute top-2 right-2 text-destructive hover:text-destructive/90 h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <CardContent className="flex flex-row items-start p-4 gap-3">
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
            <h4 className="font-medium truncate flex items-center gap-1">
              {connection.displayName}
            </h4>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
