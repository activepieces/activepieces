import { t } from 'i18next';
import { ChevronDown, Folder, Loader2, Workflow } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar-shadcn';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { PopulatedFlow } from '@activepieces/shared';

interface Folder {
  id: string;
  displayName: string;
}

interface FoldersSectionProps {
  folders?: Folder[];
  flows: PopulatedFlow[];
  isLoading: boolean;
  className?: string;
}

interface FlowsByFolder {
  [folderId: string]: PopulatedFlow[];
}

export function FoldersSection({
  folders,
  flows,
  isLoading,
  className,
}: FoldersSectionProps) {
  const navigate = useNavigate();
  const { flowId: currentFlowId } = useParams();

  const flowsByFolder = flows.reduce<FlowsByFolder>((acc, flow) => {
    const folderId = flow.folderId || 'default';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(flow);
    return acc;
  }, {});

  const sortedFolders =
    folders?.sort((a, b) => a.displayName.localeCompare(b.displayName)) || [];

  const defaultFolderFlows = flowsByFolder['default'] || [];

  const handleFlowClick = (flowId: string) => {
    navigate(
      authenticationSession.appendProjectRoutePrefix(`/flows/${flowId}`),
    );
  };

  const isFlowActive = (flowId: string) => currentFlowId === flowId;

  if (isLoading) {
    return (
      <SidebarMenu className={className}>
        <SidebarMenuItem>
          <SidebarMenuButton disabled className="px-2">
            <Loader2 className="animate-spin w-4 h-4 mr-1" />
            {t('Loading...')}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu className={className}>
      {/* Default Folder */}
      {defaultFolderFlows.length > 0 && (
        <DefaultFolder
          flows={defaultFolderFlows}
          onFlowClick={handleFlowClick}
          isFlowActive={isFlowActive}
        />
      )}

      {/* Regular Folders */}
      {sortedFolders.map((folder) => (
        <RegularFolder
          key={folder.id}
          folder={folder}
          flows={flowsByFolder[folder.id] || []}
          onFlowClick={handleFlowClick}
          isFlowActive={isFlowActive}
        />
      ))}
    </SidebarMenu>
  );
}

interface FolderProps {
  flows: PopulatedFlow[];
  onFlowClick: (flowId: string) => void;
  isFlowActive: (flowId: string) => boolean;
}

type DefaultFolderProps = FolderProps;

function DefaultFolder({
  flows,
  onFlowClick,
  isFlowActive,
}: DefaultFolderProps) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2">
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
            <Folder className="w-4 h-4 mr-1 text-muted-foreground" />
            <span>{t('Default')}</span>
            <span className="text-xs text-muted-foreground font-semibold ml-auto">
              {flows.length}
            </span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {flows.map((flow) => (
              <FlowItem
                key={flow.id}
                flow={flow}
                isActive={isFlowActive(flow.id)}
                onClick={() => onFlowClick(flow.id)}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface RegularFolderProps extends FolderProps {
  folder: Folder;
}

function RegularFolder({
  folder,
  flows,
  onFlowClick,
  isFlowActive,
}: RegularFolderProps) {
  return (
    <Collapsible
      key={folder.id}
      defaultOpen={false}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2">
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
            <Folder className="w-4 h-4 mr-1 text-muted-foreground" />
            <span className="truncate">{folder.displayName}</span>
            {flows.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {flows.length}
              </span>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>

        {flows.length > 0 && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {flows.map((flow) => (
                <FlowItem
                  key={flow.id}
                  flow={flow}
                  isActive={isFlowActive(flow.id)}
                  onClick={() => onFlowClick(flow.id)}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface FlowItemProps {
  flow: PopulatedFlow;
  isActive: boolean;
  onClick: () => void;
}

function FlowItem({ flow, isActive, onClick }: FlowItemProps) {
  return (
    <SidebarMenuSubItem className="cursor-pointer">
      <SidebarMenuSubButton
        onClick={onClick}
        className={cn(isActive && 'bg-primary-300/20')}
      >
        <Workflow className="w-3 h-3 mr-1 !text-muted-foreground" />
        <span className="truncate">{flow.version.displayName}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
