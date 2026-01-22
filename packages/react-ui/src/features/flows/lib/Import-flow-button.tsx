import { t } from 'i18next';
import { Import } from 'lucide-react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { ImportFlowDialog } from '../components/import-flow-dialog';

type ImportFlowButtonProps = {
  variant?: 'default' | 'small';
  className?: string;
  folderId: string;
  onRefresh?: () => void;
};

export const ImportFlowButton = ({
  variant = 'default',
  className,
  folderId,
  onRefresh,
}: ImportFlowButtonProps) => {
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);

  if (embedState.hideExportAndImportFlow) {
    return null;
  }

  return (
    <PermissionNeededTooltip hasPermission={doesUserHavePermissionToWriteFlow}>
      <Tooltip delayDuration={100}>
        <ImportFlowDialog
          insideBuilder={false}
          onRefresh={() => {
            if (onRefresh) onRefresh();
          }}
          folderId={folderId}
        >
          <TooltipTrigger asChild>
            <Button
              disabled={!doesUserHavePermissionToWriteFlow}
              variant={variant === 'small' ? 'ghost' : 'outline'}
              size={variant === 'small' ? 'icon' : 'default'}
              className={cn(
                variant === 'small' ? '!bg-transparent' : '',
                className,
              )}
              data-testid="import-flow-button"
            >
              {variant === 'small' ? (
                <Import className="h-4 w-4" />
              ) : (
                <>
                  <Import className="h-4 w-4 mr-2" />
                  <span>{t('Import')}</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
        </ImportFlowDialog>
        <TooltipContent>{t('Import flow')}</TooltipContent>
      </Tooltip>
    </PermissionNeededTooltip>
  );
};
