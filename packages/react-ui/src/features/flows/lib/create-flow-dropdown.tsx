import { t } from 'i18next';
import { ChevronDown, Plus, Upload, Workflow } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { ImportFlowDialog } from '../components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '../components/select-flow-template-dialog';

import { flowHooks } from './flow-hooks';

type CreateFlowDropdownProps = {
  refetch: () => void | null;
  variant?: 'default' | 'small';
  className?: string;
  folderId: string;
};

export const CreateFlowDropdown = ({
  refetch,
  variant = 'default',
  className,
  folderId,
}: CreateFlowDropdownProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const [refresh, setRefresh] = useState(0);
  const { embedState } = useEmbedding();
  const { mutate: createFlow, isPending: isCreateFlowPending } = flowHooks.useStartFromScratch(folderId);

  return (
    <PermissionNeededTooltip hasPermission={doesUserHavePermissionToWriteFlow}>
      <DropdownMenu modal={false}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger
              disabled={!doesUserHavePermissionToWriteFlow}
              asChild
              className={cn(className)}
            >
              <Button
                disabled={!doesUserHavePermissionToWriteFlow}
                variant={variant === 'small' ? 'ghost' : 'default'}
                size={variant === 'small' ? 'icon' : 'default'}
                className={cn(variant === 'small' ? '!bg-transparent' : '')}
                loading={isCreateFlowPending}
                onClick={(e) => e.stopPropagation()}
                data-testid="new-flow-button"
              >
                {variant === 'small' ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <>
                    <span>{t('New Flow')}</span>
                    <ChevronDown className="h-4 w-4 ml-2 " />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side={variant === 'small' ? 'right' : 'bottom'}>
            {t('New flow')}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              createFlow();
            }}
            disabled={isCreateFlowPending}
            data-testid="new-flow-from-scratch-button"
          >
            <Plus className="h-4 w-4 me-2" />
            <span>{t('From scratch')}</span>
          </DropdownMenuItem>
          <SelectFlowTemplateDialog folderId={folderId}>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              disabled={isCreateFlowPending}
            >
              <Workflow className="h-4 w-4 me-2" />
              <span>{t('Use a template')}</span>
            </DropdownMenuItem>
          </SelectFlowTemplateDialog>

          {!embedState.hideExportAndImportFlow && (
            <ImportFlowDialog
              insideBuilder={false}
              onRefresh={() => {
                setRefresh(refresh + 1);
                if (refetch) refetch();
              }}
              folderId={folderId}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                disabled={!doesUserHavePermissionToWriteFlow}
              >
                <Upload className="h-4 w-4 me-2" />
                {t('From local file')}
              </DropdownMenuItem>
            </ImportFlowDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionNeededTooltip>
  );
};
