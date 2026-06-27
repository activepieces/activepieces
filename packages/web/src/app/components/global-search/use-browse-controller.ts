import { Permission } from '@activepieces/core-utils';
import { ProjectType, type ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { Settings2Icon } from '@/components/icons/settings2';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { VariableIcon } from '@/components/icons/variable';
import { useEmbedding } from '@/components/providers/embed-provider';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM, NEW_TABLE_QUERY_PARAM } from '@/lib/route-utils';

import { type StageResource } from '../workspace-shell/stage-context';

import { recordAccess } from './access-history';
import { useBrowseMutations } from './use-browse-mutations';
import {
  type BrowseCategory,
  type ProjectFilter,
  useBrowseNavigation,
} from './use-browse-navigation';
import { useBrowseResults } from './use-browse-results';
import {
  type SearchResultItem,
  useGlobalSearchResults,
} from './use-global-search-results';

type ActionIcon = React.ComponentType<{ className?: string; size?: number }>;

export function useBrowseController({
  onClose,
}: {
  onClose: () => void;
}): BrowseController {
  const navigate = useNavigate();
  const activeProjectId = authenticationSession.getProjectId() ?? '';
  const browse = useBrowseNavigation(activeProjectId);
  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const { project: activeProject } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { platform } = platformHooks.useCurrentPlatform();
  const mutations = useBrowseMutations(browse.projectId);

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 200);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [projectMenuIndex, setProjectMenuIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasQuery = debouncedSearch.length > 0;

  const searchResults = useGlobalSearchResults(debouncedSearch, true);
  const browseResults = useBrowseResults({
    projectId: browse.projectId,
    category: browse.category,
    projectFilter: browse.projectFilter,
    enabled: !hasQuery,
  });
  const { groups, isLoading } = hasQuery ? searchResults : browseResults;

  const currentProject = allProjects.find((p) => p.id === browse.projectId);
  const isActiveContext = browse.projectId === activeProjectId;
  const canWriteFlow = !isActiveContext || checkAccess(Permission.WRITE_FLOW);
  const canWriteTable = !isActiveContext || checkAccess(Permission.WRITE_TABLE);
  const canWriteFolder =
    !isActiveContext || checkAccess(Permission.WRITE_FOLDER);

  const flatItems = groups.flatMap((group) => group.items);
  const clampedIndex =
    flatItems.length === 0 ? -1 : Math.min(selectedIndex, flatItems.length - 1);

  const openItem = useCallback(
    (item: SearchResultItem) => {
      if (
        item.type === 'flow' ||
        item.type === 'table' ||
        item.type === 'project' ||
        item.type === 'page'
      ) {
        recordAccess({
          id: item.id,
          type: item.type,
          label: item.label,
          href: item.href,
          status: item.status,
          folderName: item.folderName,
          projectName: item.projectName ?? null,
          iconBgColor: item.iconBgColor,
          iconTextColor: item.iconTextColor,
          iconLetter: item.iconLetter,
        });
      }
      if (item.projectId && item.projectId !== activeProjectId) {
        projectCollectionUtils.setCurrentProject(item.projectId);
      }
      const chat = new URLSearchParams(window.location.search).get('chat');
      const target = chat
        ? `${item.href}${item.href.includes('?') ? '&' : '?'}chat=${chat}`
        : item.href;
      navigate(target);
      onClose();
    },
    [navigate, onClose, activeProjectId],
  );

  const openDestination = useCallback(
    (dest: { stageType: StageResource['type']; path: string }) => {
      if (browse.projectId !== activeProjectId) {
        projectCollectionUtils.setCurrentProject(browse.projectId);
      }
      const chat = new URLSearchParams(window.location.search).get('chat');
      const base = `/projects/${browse.projectId}${dest.path}`;
      navigate(chat ? `${base}?chat=${chat}` : base);
      onClose();
    },
    [navigate, onClose, browse.projectId, activeProjectId],
  );

  const switchProject = useCallback(
    (projectId: string) => {
      browse.selectProject(projectId, 'project');
      setProjectMenuOpen(false);
    },
    [browse],
  );

  const handleProjectMenuOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        const idx = allProjects.findIndex((p) => p.id === browse.projectId);
        setProjectMenuIndex(idx >= 0 ? idx : 0);
      }
      setProjectMenuOpen(next);
    },
    [allProjects, browse.projectId],
  );

  const setCategory = useCallback(
    (category: BrowseCategory) => {
      setSelectedIndex(0);
      browse.selectCategory(category);
    },
    [browse],
  );

  const setProjectFilter = useCallback(
    (filter: ProjectFilter) => {
      setSelectedIndex(0);
      browse.selectProjectFilter(filter);
    },
    [browse],
  );

  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((i) => {
        const len = flatItems.length;
        if (len === 0) return 0;
        return (Math.max(0, Math.min(i, len - 1)) + delta + len) % len;
      });
    },
    [flatItems.length],
  );

  const openSelected = useCallback(() => {
    const item = flatItems[clampedIndex];
    if (item) openItem(item);
  }, [flatItems, clampedIndex, openItem]);

  const createFlow = useCallback(async () => {
    const flow = await mutations.createFlow();
    openItem({
      id: `browse-flow-${flow.id}`,
      type: 'flow',
      label: flow.version.displayName,
      href: `/projects/${browse.projectId}/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`,
      action: 'open',
      projectId: browse.projectId,
    });
  }, [mutations, openItem, browse.projectId]);

  const createTable = useCallback(async () => {
    const table = await mutations.createTable(t('New Table'));
    openItem({
      id: `browse-table-${table.id}`,
      type: 'table',
      label: table.name,
      href: `/projects/${browse.projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
      action: 'open',
      projectId: browse.projectId,
    });
  }, [mutations, openItem, browse.projectId]);

  const canInvite =
    isPlatformAdmin &&
    !embedState.isEmbedded &&
    platform.plan.projectRolesEnabled &&
    currentProject?.type === ProjectType.TEAM;

  const releasesEnabled = isActiveContext
    ? activeProject?.releasesEnabled
    : currentProject?.releasesEnabled;

  const projectActions: BrowseAction[] = [
    {
      key: 'runs',
      label: t('Runs'),
      Icon: HistoryIcon,
      shortcut: 'R',
      hidden: isActiveContext && !checkAccess(Permission.READ_RUN),
      onSelect: () => openDestination({ stageType: 'runs', path: '/runs' }),
    },
    {
      key: 'connections',
      label: t('Connections'),
      Icon: ConnectIcon,
      shortcut: 'C',
      hidden: isActiveContext && !checkAccess(Permission.READ_APP_CONNECTION),
      onSelect: () =>
        openDestination({ stageType: 'connections', path: '/connections' }),
    },
    {
      key: 'variables',
      label: t('Variables'),
      Icon: VariableIcon,
      shortcut: 'V',
      hidden: isActiveContext && !checkAccess(Permission.READ_VARIABLE),
      onSelect: () =>
        openDestination({ stageType: 'variables', path: '/variables' }),
    },
    {
      key: 'releases',
      label: t('Releases'),
      Icon: BoxIcon,
      shortcut: 'L',
      hidden: embedState.isEmbedded || !releasesEnabled,
      onSelect: () =>
        openDestination({ stageType: 'releases', path: '/releases' }),
    },
    {
      key: 'settings',
      label: t('Settings'),
      Icon: Settings2Icon,
      shortcut: 'S',
      hidden: false,
      onSelect: () =>
        openDestination({ stageType: 'settings', path: '/settings' }),
    },
    {
      key: 'invite',
      label: t('Invite'),
      Icon: UserRoundPlusIcon,
      shortcut: 'I',
      hidden: !canInvite,
      onSelect: () => setInviteOpen(true),
    },
  ].filter((action) => !action.hidden);

  return {
    search,
    setSearch,
    hasQuery,
    debouncedSearch,
    category: browse.category,
    setCategory,
    projectFilter: browse.projectFilter,
    setProjectFilter,
    projectId: browse.projectId,
    allProjects,
    currentProject,
    currentProjectName: currentProject ? getProjectName(currentProject) : '',
    switchProject,
    projectMenuOpen,
    projectMenuIndex,
    handleProjectMenuOpenChange,
    groups,
    isLoading,
    flatItems,
    selectedIndex: clampedIndex,
    moveSelection,
    openSelected,
    openItem,
    openDestination,
    projectActions,
    hideTables: embedState.hideTables,
    canWriteFlow,
    canWriteTable,
    canWriteFolder,
    isCreatingFlow: mutations.isCreatingFlow,
    isCreatingTable: mutations.isCreatingTable,
    createFlow,
    createTable,
    createFolderOpen,
    setCreateFolderOpen,
    invalidate: mutations.invalidate,
    inviteOpen,
    setInviteOpen,
    canInvite: !!canInvite,
  };
}

export type BrowseAction = {
  key: string;
  label: string;
  Icon: ActionIcon;
  shortcut: string;
  hidden: boolean;
  onSelect: () => void;
};

export type BrowseController = {
  search: string;
  setSearch: (value: string) => void;
  hasQuery: boolean;
  debouncedSearch: string;
  category: BrowseCategory;
  setCategory: (category: BrowseCategory) => void;
  projectFilter: ProjectFilter;
  setProjectFilter: (filter: ProjectFilter) => void;
  projectId: string;
  allProjects: ProjectWithLimits[];
  currentProject?: ProjectWithLimits;
  currentProjectName: string;
  switchProject: (projectId: string) => void;
  projectMenuOpen: boolean;
  projectMenuIndex: number;
  handleProjectMenuOpenChange: (open: boolean) => void;
  groups: ReturnType<typeof useBrowseResults>['groups'];
  isLoading: boolean;
  flatItems: SearchResultItem[];
  selectedIndex: number;
  moveSelection: (delta: number) => void;
  openSelected: () => void;
  openItem: (item: SearchResultItem) => void;
  openDestination: (dest: {
    stageType: StageResource['type'];
    path: string;
  }) => void;
  projectActions: BrowseAction[];
  hideTables: boolean;
  canWriteFlow: boolean;
  canWriteTable: boolean;
  canWriteFolder: boolean;
  isCreatingFlow: boolean;
  isCreatingTable: boolean;
  createFlow: () => Promise<void>;
  createTable: () => Promise<void>;
  createFolderOpen: boolean;
  setCreateFolderOpen: (open: boolean) => void;
  invalidate: () => void;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
  canInvite: boolean;
};
