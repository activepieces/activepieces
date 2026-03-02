import {
  AnalyticsTimePeriod,
  ColorName,
  UserWithBadges,
} from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Info,
  LayoutGrid,
  RefreshCcw,
  Users,
  X,
} from 'lucide-react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { userApi } from '@/api/user-api';
import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import {
  RefreshAnalyticsContext,
  RefreshAnalyticsProvider,
} from '@/features/platform-admin/lib/refresh-analytics-context';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { downloadFile } from '@/lib/dom-utils';
import { formatUtils } from '@/lib/format-utils';

import { TimeSavedFilterContent } from '../impact/components/time-saved-filter-content';
import {
  convertToSeconds,
  TIME_UNITS,
  TimeUnit,
} from '../impact/lib/impact-utils';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

type TimeSavedFilter = {
  min: string;
  max: string;
  unitMin: TimeUnit;
  unitMax: TimeUnit;
};

const emptyFilter: TimeSavedFilter = {
  min: '',
  max: '',
  unitMin: 'Sec',
  unitMax: 'Sec',
};

function applyTimeSavedFilter<T extends { minutesSaved: number }>(
  data: T[],
  filter: TimeSavedFilter,
): T[] {
  let result = data;
  const minValue = filter.min ? parseFloat(filter.min) : null;
  const maxValue = filter.max ? parseFloat(filter.max) : null;
  if (minValue !== null) {
    result = result.filter(
      (p) => p.minutesSaved >= convertToSeconds(minValue, filter.unitMin),
    );
  }
  if (maxValue !== null) {
    result = result.filter(
      (p) => p.minutesSaved <= convertToSeconds(maxValue, filter.unitMax),
    );
  }
  return result;
}

export default function LeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>(
    AnalyticsTimePeriod.LAST_WEEK,
  );
  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    platformAnalyticsHooks.useAnalytics();
  const { data: usersLeaderboardData, isLoading: isUsersLoading } =
    platformAnalyticsHooks.useUsersLeaderboard(timePeriod);
  const { data: projectsLeaderboardData, isLoading: isProjectsLoading } =
    platformAnalyticsHooks.useProjectLeaderboard(timePeriod);
  const { data: allProjects } = projectCollectionUtils.useAllPlatformProjects();

  const projectIconMap = useMemo(() => {
    const map = new Map<string, ColorName>();
    allProjects?.forEach((p) => {
      if (p.icon) {
        map.set(p.id, p.icon.color);
      }
    });
    return map;
  }, [allProjects]);
  const [activeTab, setActiveTab] = useState('creators');
  const [searchQuery, setSearchQuery] = useState('');

  const [peopleTimeSaved, setPeopleTimeSaved] =
    useState<TimeSavedFilter>(emptyFilter);
  const [projectsTimeSaved, setProjectsTimeSaved] =
    useState<TimeSavedFilter>(emptyFilter);

  const appliedFilter =
    activeTab === 'creators' ? peopleTimeSaved : projectsTimeSaved;
  const setAppliedFilter =
    activeTab === 'creators' ? setPeopleTimeSaved : setProjectsTimeSaved;

  const [draftTimeSavedMin, setDraftTimeSavedMin] = useState('');
  const [draftTimeSavedMax, setDraftTimeSavedMax] = useState('');
  const [draftTimeUnitMin, setDraftTimeUnitMin] = useState<TimeUnit>('Sec');
  const [draftTimeUnitMax, setDraftTimeUnitMax] = useState<TimeUnit>('Sec');
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = useState(false);

  const { mutate: refreshAnalytics } =
    platformAnalyticsHooks.useRefreshAnalytics();
  const { isRefreshing } = useContext(RefreshAnalyticsContext);

  const userIds = useMemo(
    () => usersLeaderboardData?.map((u) => u.userId) ?? [],
    [usersLeaderboardData],
  );

  const badgeQueries = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: ['user-badges', userId],
      queryFn: () => userApi.getUserById(userId),
      staleTime: 5 * 60 * 1000,
      enabled: userIds.length > 0,
    })),
  });

  const badgesMap = useMemo(() => {
    const map = new Map<string, UserWithBadges['badges']>();
    badgeQueries.forEach((q) => {
      if (q.data) {
        map.set(q.data.id, q.data.badges);
      }
    });
    return map;
  }, [badgeQueries]);

  const isLoading = isAnalyticsLoading || isUsersLoading || isProjectsLoading;

  const cycleDraftTimeUnitMin = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMin);
    setDraftTimeUnitMin(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const cycleDraftTimeUnitMax = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnitMax);
    setDraftTimeUnitMax(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSavedMin(appliedFilter.min);
      setDraftTimeSavedMax(appliedFilter.max);
      setDraftTimeUnitMin(appliedFilter.unitMin);
      setDraftTimeUnitMax(appliedFilter.unitMax);
    }
    setTimeSavedPopoverOpen(open);
  };

  const handleApplyFilter = () => {
    setAppliedFilter({
      min: draftTimeSavedMin,
      max: draftTimeSavedMax,
      unitMin: draftTimeUnitMin,
      unitMax: draftTimeUnitMax,
    });
    setTimeSavedPopoverOpen(false);
  };

  const clearTimeSavedFilter = () => {
    setAppliedFilter(emptyFilter);
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = useMemo(() => {
    if (!appliedFilter.min && !appliedFilter.max) return null;
    const min = appliedFilter.min
      ? `${appliedFilter.min} ${appliedFilter.unitMin}`
      : '0';
    const max = appliedFilter.max
      ? `${appliedFilter.max} ${appliedFilter.unitMax}`
      : '∞';
    return `${min} – ${max}`;
  }, [appliedFilter]);

  const peopleData = useMemo((): UserStats[] => {
    if (isLoading || !analyticsData?.users || !usersLeaderboardData) {
      return [];
    }

    const userMap = new Map(analyticsData.users.map((user) => [user.id, user]));

    return usersLeaderboardData.reduce<UserStats[]>((acc, item) => {
      const user = userMap.get(item.userId);
      if (!user) return acc;

      acc.push({
        id: item.userId,
        visibleId: item.userId,
        userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        userEmail: user.email,
        flowCount: item.flowCount ?? 0,
        minutesSaved: item.minutesSaved ?? 0,
        badges: badgesMap.get(item.userId),
      });
      return acc;
    }, []);
  }, [analyticsData?.users, usersLeaderboardData, isLoading, badgesMap]);

  const projectsData = useMemo((): ProjectStats[] => {
    if (isLoading || !projectsLeaderboardData) {
      return [];
    }

    return projectsLeaderboardData.map((item) => ({
      id: item.projectId,
      projectId: item.projectId,
      projectName: item.projectName,
      flowCount: item.flowCount ?? 0,
      minutesSaved: item.minutesSaved ?? 0,
      iconColor: projectIconMap.get(item.projectId),
    }));
  }, [projectsLeaderboardData, isLoading, projectIconMap]);

  const filteredPeopleData = useMemo(() => {
    let data = peopleData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (p) =>
          p.userName.toLowerCase().includes(q) ||
          p.userEmail.toLowerCase().includes(q),
      );
    }
    return applyTimeSavedFilter(data, peopleTimeSaved).sort(
      (a, b) => b.minutesSaved - a.minutesSaved,
    );
  }, [peopleData, searchQuery, peopleTimeSaved]);

  const filteredProjectsData = useMemo(() => {
    let data = projectsData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((p) => p.projectName.toLowerCase().includes(q));
    }
    return applyTimeSavedFilter(data, projectsTimeSaved);
  }, [projectsData, searchQuery, projectsTimeSaved]);

  const handleDownload = () => {
    if (activeTab === 'creators') {
      if (filteredPeopleData.length === 0) return;

      const csvHeader = 'Name,Email,Flows,Time Saved\n';
      const csvContent = filteredPeopleData
        .map(
          (person) =>
            `"${person.userName}","${person.userEmail}",${
              person.flowCount
            },"${formatUtils.formatToHoursAndMinutes(
              person.minutesSaved || 0,
            )}"`,
        )
        .join('\n');

      downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'people-leaderboard',
        extension: 'csv',
      });
    } else {
      if (filteredProjectsData.length === 0) return;

      const csvHeader = 'Project,Flows,Time Saved\n';
      const csvContent = filteredProjectsData
        .map(
          (project) =>
            `"${project.projectName}",${
              project.flowCount
            },"${formatUtils.formatToHoursAndMinutes(
              project.minutesSaved || 0,
            )}"`,
        )
        .join('\n');

      downloadFile({
        obj: csvHeader + csvContent,
        fileName: 'projects-leaderboard',
        extension: 'csv',
      });
    }
  };

  const isDownloadDisabled =
    isLoading ||
    (activeTab === 'creators' && filteredPeopleData.length === 0) ||
    (activeTab === 'projects' && filteredProjectsData.length === 0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <RefreshAnalyticsProvider>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <ApSidebarToggle />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-medium">{t('Leaderboard')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  {t('See top performers by flows created and time saved')}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground">
              <span>
                {t('Updated')}{' '}
                {dayjs(analyticsData?.cachedAt).format('MMM DD, hh:mm A')}
                {' — '}
                {t('Refreshes daily')}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      refreshAnalytics(undefined, {
                        onSuccess: () =>
                          toast.success(t('Data refreshed successfully')),
                      })
                    }
                    disabled={isRefreshing}
                  >
                    <RefreshCcw
                      className={`h-3.5 w-3.5 ${
                        isRefreshing ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Refresh analytics')}</TooltipContent>
              </Tooltip>
            </div>

            <Select
              value={timePeriod}
              onValueChange={(value) =>
                setTimePeriod(value as AnalyticsTimePeriod)
              }
            >
              <SelectTrigger className="w-auto gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="end">
                <SelectItem value={AnalyticsTimePeriod.LAST_WEEK}>
                  {t('Last 7 days')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.LAST_MONTH}>
                  {t('Last 30 days')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.LAST_THREE_MONTHS}>
                  {t('Last 3 months')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.LAST_SIX_MONTHS}>
                  {t('Last 6 months')}
                </SelectItem>
                <SelectItem value={AnalyticsTimePeriod.LAST_YEAR}>
                  {t('Last year')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs
          defaultValue="creators"
          className="w-full mt-2"
          onValueChange={handleTabChange}
        >
          <TabsList variant="outline" className="border-b w-full">
            <TabsTrigger variant="outline" value="creators">
              <Users className="w-4 h-4 mr-1.5" />
              {t('People')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="projects">
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              {t('Projects')}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between mt-4 mb-4">
            <div className="flex items-center gap-2">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  activeTab === 'creators'
                    ? t('Search users')
                    : t('Search projects')
                }
                className="w-[200px]"
              />
              <Popover
                open={timeSavedPopoverOpen}
                onOpenChange={handleTimeSavedPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 font-normal border-dashed"
                  >
                    <Clock className="h-4 w-4" />
                    <span>{t('Time Saved')}</span>
                    {timeSavedLabel && (
                      <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
                        {timeSavedLabel}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-4" align="start">
                  <TimeSavedFilterContent
                    draftMin={draftTimeSavedMin}
                    onMinChange={setDraftTimeSavedMin}
                    unitMin={draftTimeUnitMin}
                    onCycleUnitMin={cycleDraftTimeUnitMin}
                    draftMax={draftTimeSavedMax}
                    onMaxChange={setDraftTimeSavedMax}
                    unitMax={draftTimeUnitMax}
                    onCycleUnitMax={cycleDraftTimeUnitMax}
                    onApply={handleApplyFilter}
                  />
                </PopoverContent>
              </Popover>
              {timeSavedLabel && (
                <button
                  onClick={clearTimeSavedFilter}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('Clear')}
                </button>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloadDisabled}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('Download')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Download leaderboard data')}</TooltipContent>
            </Tooltip>
          </div>

          <TabsContent value="creators">
            <UsersLeaderboard data={filteredPeopleData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsLeaderboard
              data={filteredProjectsData}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RefreshAnalyticsProvider>
  );
}
