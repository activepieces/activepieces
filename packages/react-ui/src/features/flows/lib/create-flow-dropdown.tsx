import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, Plus, Upload, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
import { folderIdParamName } from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import { Permission, PopulatedFlow } from '@activepieces/shared';

import { ImportFlowDialog } from '../components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '../components/select-flow-template-dialog';

import { flowsApi } from './flows-api';

type CreateFlowDropdownProps = {
  refetch?: () => void;
  variant?: 'default' | 'small';
  className?: string;
  folderId?: string;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async () => {
      const effectiveFolderId = folderId ?? searchParams.get(folderIdParamName);
      const folder =
        effectiveFolderId && effectiveFolderId !== 'NULL'
          ? await foldersApi.get(effectiveFolderId)
          : undefined;
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
        folderName: folder?.displayName,
      });
      return flow;
    },
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
    },
  });

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
                loading={isCreateFlowPending}
                onClick={(e) => e.stopPropagation()}
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
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              createFlow();
            }}
            disabled={isCreateFlowPending}
          >
            <Plus className="h-4 w-4 me-2" />
            <span>{t('From scratch')}</span>
          </DropdownMenuItem>
          <SelectFlowTemplateDialog>
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
