import { useQuery, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  History,
  CircleAlert,
  Plus,
  Upload,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { folderIdParamName } from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import { FlowStatus, Permission, PopulatedFlow } from '@activepieces/shared';

import { TableTitle } from '../../../components/ui/table-title';

import { FlowsTable } from './flows-table';
import { IssuesTable } from './issues-table';
import TaskLimitAlert from './task-limit-alert';

export enum FlowsPageTabs {
  HISTORY = 'history',
  ISSUES = 'issues',
  FLOWS = 'flows',
}

const FlowsPage = () => {
  const { checkAccess } = useAuthorization();
  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const determineActiveTab = () => {
    if (location.pathname.includes('/runs')) {
      return FlowsPageTabs.HISTORY;
    } else if (location.pathname.includes('/issues')) {
      return FlowsPageTabs.ISSUES;
    } else {
      return FlowsPageTabs.FLOWS;
    }
  };

  const [activeTab, setActiveTab] = useState<FlowsPageTabs>(
    determineActiveTab(),
  );

  useEffect(() => {
    setActiveTab(determineActiveTab());
  }, [location.pathname]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flow-table', searchParams.toString(), projectId],
    staleTime: 0,
    queryFn: () => {
      const name = searchParams.get('name');
      const status = searchParams.getAll('status') as FlowStatus[];
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      const folderId = searchParams.get('folderId') ?? undefined;

      return flowsApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        name: name ?? undefined,
        status,
        folderId,
      });
    },
  });

  const { embedState } = useEmbedding();

  const handleTabChange = (value: FlowsPageTabs) => {
    setActiveTab(value);

    let newPath = location.pathname;
    if (value === FlowsPageTabs.HISTORY) {
      newPath = newPath.replace(/\/(flows|issues)$/, '/runs');
    } else if (value === FlowsPageTabs.ISSUES) {
      newPath = newPath.replace(/\/(flows|runs)$/, '/issues');
    } else {
      newPath = newPath.replace(/\/(runs|issues)$/, '/flows');
    }

    navigate(newPath);
  };

  return (
    <div className="flex flex-col gap-4 grow">
      <TaskLimitAlert />
      <div className="flex flex-col gap-4 w-full grow">
        <div className="flex items-center justify-between">
          <TableTitle
            description={t(
              'Create and manage your flows, run history and run issues',
            )}
          >
            {t('Flows')}
          </TableTitle>
          {activeTab === FlowsPageTabs.FLOWS && (
            <CreateFlowDropdown refetch={refetch} />
          )}
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as FlowsPageTabs)}
          className="w-full"
        >
          {!embedState.hideSideNav ? (
            <TabsList variant="outline">
              <TabsTrigger value={FlowsPageTabs.FLOWS} variant="outline">
                <Workflow className="h-4 w-4 mr-2" />
                {t('Flows')}
              </TabsTrigger>
              {checkAccess(Permission.READ_RUN) && (
                <TabsTrigger value={FlowsPageTabs.HISTORY} variant="outline">
                  <History className="h-4 w-4 mr-2" />
                  {t('Runs')}
                </TabsTrigger>
              )}
              {checkAccess(Permission.READ_ISSUES) && (
                <TabsTrigger value={FlowsPageTabs.ISSUES} variant="outline">
                  <CircleAlert className="h-4 w-4 mr-2" />
                  <span className="flex items-center gap-2">
                    {t('Issues')}
                    {showIssuesNotification && (
                      <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
          ) : (
            <></>
          )}
          <TabsContent value={FlowsPageTabs.FLOWS}>
            <FlowsTable data={data} isLoading={isLoading} refetch={refetch} />
          </TabsContent>
          <TabsContent value={FlowsPageTabs.HISTORY}>
            <RunsTable />
          </TabsContent>
          <TabsContent value={FlowsPageTabs.ISSUES}>
            <IssuesTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export { FlowsPage };

type CreateFlowDropdownProps = {
  refetch: () => void;
};

const CreateFlowDropdown = ({ refetch }: CreateFlowDropdownProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const [refresh, setRefresh] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
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

          <ImportFlowDialog
            insideBuilder={false}
            onRefresh={() => {
              setRefresh(refresh + 1);
              refetch();
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
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionNeededTooltip>
  );
};
