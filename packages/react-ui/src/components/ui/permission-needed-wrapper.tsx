import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { t } from 'i18next';

export const PermissionNeededWrapper = ({
  children,
  hasPermission,
}: {
  children: React.ReactNode;
  hasPermission: boolean;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger className="w-full" disabled={!hasPermission}>
        {children}
      </TooltipTrigger>
      {!hasPermission ? (
        <TooltipContent side="bottom">{t('Permission needed')}</TooltipContent>
      ) : null}
    </Tooltip>
  );
};
