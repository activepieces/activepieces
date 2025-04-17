import { t } from 'i18next';
import { PlugIcon, Trash2 } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

import { Card, CardContent } from '../../../components/ui/card';
import { PieceIcon } from '../../../features/pieces/components/piece-icon';

type McpConnectionProps = {
  connection: AppConnectionWithoutSensitiveData;
  pieceInfo: {
    displayName: string;
    logoUrl?: string;
  };
  onDelete: (connection: AppConnectionWithoutSensitiveData) => void;
  isLoading?: boolean;
};

export const McpConnection = ({
  connection,
  pieceInfo,
  onDelete,
  isLoading = false,
}: McpConnectionProps) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-200 relative hover:shadow-sm group border-border">
        <CardContent className="flex flex-row items-start p-4 gap-3">
          <div className="flex items-center space-x-3 min-w-0 py-1.5">
            <div className="relative">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full" />
            </div>
            <div className="min-w-0 flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 relative hover:shadow-sm group border-border">
      <ConfirmationDeleteDialog
        title={`${t('Delete')} ${connection.displayName}`}
        message={
          <div>{t('Are you sure you want to delete this connection?')}</div>
        }
        mutationFn={async () => {
          onDelete(connection);
        }}
        entityName={t('connection')}
      >
        <div className="absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-destructive/10 rounded-full transition-all duration-200">
          <Trash2 className="h-4 w-4 text-destructive transition-colors duration-200 group-hover:text-destructive/90" />
        </div>
      </ConfirmationDeleteDialog>

      <CardContent className="flex flex-row items-start p-4 gap-3">
        <div className="flex items-center space-x-3 min-w-0 py-1.5">
          <div className="relative">
            <PieceIcon
              displayName={pieceInfo.displayName}
              logoUrl={pieceInfo.logoUrl}
              size="md"
              showTooltip={true}
              circle={true}
              border={true}
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
              <PlugIcon className="h-3 w-3" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-foreground truncate flex items-center gap-1">
              {connection.displayName}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pieceInfo.displayName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
