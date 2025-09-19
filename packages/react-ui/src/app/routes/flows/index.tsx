import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  History,
  CircleAlert,
  Plus,
  Upload,
  Workflow,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { folderIdParamName } from '@/features/folders/component/folder-filter-list';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import { Permission, PopulatedFlow } from '@activepieces/shared';

import { FlowsTable } from './flows-table';
import { IssuesTable } from './issues-table';

export enum FlowsPageTabs {
  HISTORY = 'history',
  ISSUES = 'issues',
  FLOWS = 'flows',
}

const FlowsPage = () => {
  const { checkAccess } = useAuthorization();
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
    <div className="flex flex-col gap-4 w-full grow">
      <DashboardPageHeader
        tutorialTab="flows"
        title={t('Flows')}
        description={t(
          'Create and manage your flows, run history and run issues',
        )}
      >
        {activeTab === FlowsPageTabs.FLOWS && <CreateFlowDropdown />}
      </DashboardPageHeader>
      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as FlowsPageTabs)}
        className="w-full"
      >
        {!embedState.hideFlowsPageNavbar ? (
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
          <FlowsTable />
        </TabsContent>
        <TabsContent value={FlowsPageTabs.HISTORY}>
          <RunsTable />
        </TabsContent>
        <TabsContent value={FlowsPageTabs.ISSUES}>
          <IssuesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { FlowsPage };

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
        <DropdownMenuContent>
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
