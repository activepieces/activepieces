import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { EllipsisVertical, Folder, FolderOpen, Shapes } from 'lucide-react';
import { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CreateFlowDropdown } from '@/app/routes/flows';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSkeleton,
} from '@/components/ui/sidebar-shadcn';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { CreateFolderDialog } from '@/features/folders/component/create-folder-dialog';
import { FolderActions } from '@/features/folders/component/folder-actions';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, PopulatedFlow } from '@activepieces/shared';

import FlowActionMenu from '../../flow-actions-menu';

interface FlowsByFolder {
  [folderId: string]: PopulatedFlow[];
}

export function FlowsNavigation() {
  const navigate = useNavigate();
  const { flowId: currentFlowId } = useParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [previousFlowCount, setPreviousFlowCount] = useState<number>(0);

  const {
    folders,
    isLoading: foldersLoading,
    refetch: refetchFolders,
  } = foldersHooks.useFolders();

  const {
    data: flows,
    isLoading: flowsLoading,
    refetch: refetchFlows,
  } = flowsHooks.useFlows({
    cursor: undefined,
    limit: 99999,
  });

  const flowsData = flows?.data || [];

  const flowsByFolder = flowsData.reduce<FlowsByFolder>((acc, flow) => {
    const folderId = flow.folderId || 'default';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(flow);
    return acc;
  }, {});

  const currentFlowFolderId = useMemo(() => {
    if (!currentFlowId || !flowsData.length) return null;
    const currentFlow = flowsData.find((flow) => flow.id === currentFlowId);
    return currentFlow ? currentFlow.folderId || 'default' : null;
  }, [currentFlowId, flowsData]);

  useEffect(() => {
    if (currentFlowFolderId && !flowsLoading) {
      setOpenFolders((prev) => new Set([...prev, currentFlowFolderId]));
    }
  }, [currentFlowFolderId, flowsLoading]);

  useEffect(() => {
    if (flowsLoading) return;

    const currentFlowCount = flowsData.length;

    if (currentFlowCount > previousFlowCount && previousFlowCount > 0) {
      const newFlow = flowsData[flowsData.length - 1];
      if (newFlow) {
        const newFlowFolderId = newFlow.folderId || 'default';
        setOpenFolders((prev) => new Set([...prev, newFlowFolderId]));
      }
    }

    setPreviousFlowCount(currentFlowCount);
  }, [flowsData.length, previousFlowCount, flowsLoading, flowsData]);

  useEffect(() => {
    if (!currentFlowId || foldersLoading || flowsLoading) return;

    const timeoutId = setTimeout(() => {
      const selectedFlowElement = document.querySelector(
        `[data-flow-id="${currentFlowId}"]`,
      );
      if (selectedFlowElement && scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          '[data-radix-scroll-area-viewport]',
        )!;
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = selectedFlowElement.getBoundingClientRect();

        if (
          elementRect.top < containerRect.top ||
          elementRect.bottom > containerRect.bottom
        ) {
          selectedFlowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentFlowId, foldersLoading, flowsLoading, currentFlowFolderId]);

  const handleFlowClick = (flowId: string) => {
    navigate(
      authenticationSession.appendProjectRoutePrefix(`/flows/${flowId}`),
    );
  };

  const handleFolderToggle = (folderId: string, isOpen: boolean) => {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(folderId);
      } else {
        newSet.delete(folderId);
      }
      return newSet;
    });
  };

  const sortedFolders =
    folders?.sort((a, b) => a.displayName.localeCompare(b.displayName)) || [];
  const defaultFolderFlows = flowsByFolder['default'] || [];

  if (foldersLoading || flowsLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t('Flows Folders')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarSkeleton numOfItems={6} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="pb-2 max-h-[calc(50%-10px)] pr-0">
      <SidebarGroupLabel className="flex px-2 font-semibold text-foreground text-sm justify-between items-center w-full mb-1">
        {t('Flows')}
        <CreateFolderDialog
          refetchFolders={refetchFolders}
          updateSearchParams={() => {}}
        />
      </SidebarGroupLabel>
      <ScrollArea ref={scrollAreaRef} showGradient>
        <SidebarGroupContent>
          <SidebarMenu className="pr-2">
            <DefaultFolder
              flows={defaultFolderFlows}
              onFlowClick={handleFlowClick}
              isFlowActive={(flowId) => currentFlowId === flowId}
              isOpen={openFolders.has('default')}
              onToggle={(isOpen) => handleFolderToggle('default', isOpen)}
              refetch={refetchFlows}
            />

            {sortedFolders.map((folder) => (
              <RegularFolder
                key={folder.id}
                folder={folder}
                flows={flowsByFolder[folder.id] || []}
                onFlowClick={handleFlowClick}
                isFlowActive={(flowId) => currentFlowId === flowId}
                isOpen={openFolders.has(folder.id)}
                onToggle={(isOpen) => handleFolderToggle(folder.id, isOpen)}
                refetch={refetchFlows}
                refetchFolders={refetchFolders}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </ScrollArea>
    </SidebarGroup>
  );
}

interface FolderProps {
  flows: PopulatedFlow[];
  onFlowClick: (flowId: string) => void;
  isFlowActive: (flowId: string) => boolean;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  refetch: () => void;
}

function DefaultFolder({
  flows,
  onFlowClick,
  isFlowActive,
  isOpen,
  onToggle,
  refetch,
}: FolderProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2 group/item mb-1 pr-0">
            <Shapes className="!size-3.5" />
            <span>{t('Uncategorized')}</span>
            <div className="ml-auto relative">
              <CreateFlowDropdown
                folderId="NULL"
                variant="small"
                className="opacity-0 group-hover/item:opacity-100"
              />
            </div>
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
                  refetch={refetch}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface RegularFolderProps extends FolderProps {
  folder: FolderDto;
  refetchFolders: () => void;
}

function RegularFolder({
  folder,
  flows,
  onFlowClick,
  isFlowActive,
  isOpen,
  onToggle,
  refetch,
  refetchFolders,
}: RegularFolderProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2 group/item mb-1 pr-0">
            <Folder className="!size-3.5 group-data-[state=open]/collapsible:hidden" />
            <FolderOpen className="!size-3.5 hidden group-data-[state=open]/collapsible:block" />
            <span className="truncate">{folder.displayName}</span>
            <div className="flex items-center justify-center ml-auto">
              <CreateFlowDropdown
                folderId={folder.id}
                variant="small"
                className="group-hover/item:opacity-100 opacity-0"
              />
              <FolderActions
                hideFlowCount={true}
                refetch={refetchFolders}
                folder={folder}
              />
            </div>
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
                  refetch={refetch}
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
  refetch: () => void;
}

function FlowItem({ flow, isActive, onClick, refetch }: FlowItemProps) {
  const { flowId } = useParams();
  const queryClient = useQueryClient();

  return (
    <SidebarMenuSubItem
      className="cursor-pointer group/item"
      data-flow-id={flow.id}
    >
      <SidebarMenuSubButton
        onClick={onClick}
        className={cn(isActive && 'bg-sidebar-accent', 'pr-0 pl-2')}
      >
        <span className="truncate">{flow.version.displayName}</span>
        <FlowActionMenu
          insideBuilder={false}
          flow={flow}
          readonly={false}
          flowVersion={flow.version}
          onRename={refetch}
          onMoveTo={refetch}
          onDelete={() => {
            if (flowId === flow.id) {
              flowsHooks.invalidateFlowsQuery(queryClient);
            }
            refetch();
          }}
          onDuplicate={refetch}
        >
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto group-hover/item:opacity-100 opacity-0"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </FlowActionMenu>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
