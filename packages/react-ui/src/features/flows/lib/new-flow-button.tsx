import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { flowHooks } from './flow-hooks';

type NewFlowButtonProps = {
  variant?: 'default' | 'small';
  className?: string;
  folderId: string;
};

export const NewFlowButton = ({
  variant = 'default',
  className,
  folderId,
}: NewFlowButtonProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(folderId);

  return (
    <PermissionNeededTooltip hasPermission={doesUserHavePermissionToWriteFlow}>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            disabled={!doesUserHavePermissionToWriteFlow}
            variant={variant === 'small' ? 'ghost' : 'default'}
            size={variant === 'small' ? 'icon' : 'default'}
            className={cn(
              variant === 'small' ? '!bg-transparent' : '',
              className,
            )}
            loading={isCreateFlowPending}
            onClick={(e) => {
              e.stopPropagation();
              createFlow();
            }}
            data-testid="new-flow-button"
          >
            {variant === 'small' ? (
              <Plus className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span>{t('New Flow')}</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={variant === 'small' ? 'right' : 'bottom'}>
          {t('New flow')}
        </TooltipContent>
      </Tooltip>
    </PermissionNeededTooltip>
  );
};
