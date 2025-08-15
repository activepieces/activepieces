import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  Plus,
  Upload,
  Workflow,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { folderIdParamName } from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import { Permission, PopulatedFlow } from '@activepieces/shared';

import { FlowsTable } from './flows-table';

const FlowsPage = () => {
  return (
    <div className="flex flex-col gap-4 w-full grow">
      <DashboardPageHeader
        tutorialTab="flows"
        title={t('Flows')}
        description={t(
          'Create and manage your flows, run history and run issues',
        )}
      >
        <CreateFlowDropdown />
      </DashboardPageHeader>
      <FlowsTable />
    </div>
  );
};

export { FlowsPage };

type CreateFlowDropdownProps = {
  refetch?: () => void;
};

const CreateFlowDropdown = ({ refetch }: CreateFlowDropdownProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const [searchParams] = useSearchParams();
  const { embedState } = useEmbedding();
  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async () => {
      const folderId = searchParams.get(folderIdParamName);
      const folder =
        folderId && folderId !== 'NULL'
          ? await foldersApi.get(folderId)
          : undefined;
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
        folderName: folder?.displayName,
      });
      return flow;
    },
    onSuccess: (flow) => {
      window.location.href = `/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`;
    },
  });

  return (
    <PermissionNeededTooltip hasPermission={doesUserHavePermissionToWriteFlow}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          disabled={!doesUserHavePermissionToWriteFlow}
          asChild
        >
          <Button
            disabled={!doesUserHavePermissionToWriteFlow}
            variant="default"
            loading={isCreateFlowPending}
          >
            <span>{t('Create flow')}</span>
            <ChevronDown className="h-4 w-4 ml-2 " />
          </Button>
        </DropdownMenuTrigger>
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
