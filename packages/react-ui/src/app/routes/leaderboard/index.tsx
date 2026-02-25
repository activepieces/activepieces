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
} from 'lucide-react';
import { useContext, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { userApi } from '@/lib/user-api';
import { downloadFile, formatUtils } from '@/lib/utils';
import {
  AnalyticsTimePeriod,
  ColorName,
  UserWithBadges,
} from '@activepieces/shared';

import { projectCollectionUtils } from '@/hooks/project-collection';

import {
  convertToMinutes,
  TIME_UNITS,
  TimeUnit,
} from '../impact/lib/impact-utils';

import { ProjectsLeaderboard, ProjectStats } from './projects-leaderboard';
import { UsersLeaderboard, UserStats } from './users-leaderboard';

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

  type TimeSavedFilter = { min: string; max: string; unit: TimeUnit };
  const emptyFilter: TimeSavedFilter = { min: '', max: '', unit: 'Sec' };
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
  const [draftTimeUnit, setDraftTimeUnit] = useState<TimeUnit>('Sec');
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

  const cycleDraftTimeUnit = () => {
    const idx = TIME_UNITS.indexOf(draftTimeUnit);
    setDraftTimeUnit(TIME_UNITS[(idx + 1) % TIME_UNITS.length]);
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSavedMin(appliedFilter.min);
      setDraftTimeSavedMax(appliedFilter.max);
      setDraftTimeUnit(appliedFilter.unit);
    }
    setTimeSavedPopoverOpen(open);
  };

  const applyTimeSavedFilter = () => {
    setAppliedFilter({
      min: draftTimeSavedMin,
      max: draftTimeSavedMax,
      unit: draftTimeUnit,
    });
    setTimeSavedPopoverOpen(false);
  };

  const clearTimeSavedFilter = () => {
    setAppliedFilter(emptyFilter);
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = useMemo(() => {
    if (!appliedFilter.min && !appliedFilter.max) return null;
    const min = appliedFilter.min || '0';
    const max = appliedFilter.max || '∞';
    return `${min} – ${max} ${appliedFilter.unit}`;
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

    const minValue = peopleTimeSaved.min
      ? parseFloat(peopleTimeSaved.min)
      : null;
    const maxValue = peopleTimeSaved.max
      ? parseFloat(peopleTimeSaved.max)
      : null;

    if (minValue !== null) {
      data = data.filter(
        (p) =>
          p.minutesSaved >=
          convertToMinutes(minValue, peopleTimeSaved.unit),
      );
    }
    if (maxValue !== null) {
      data = data.filter(
        (p) =>
          p.minutesSaved <=
          convertToMinutes(maxValue, peopleTimeSaved.unit),
      );
    }

    return data;
  }, [peopleData, searchQuery, peopleTimeSaved]);

  const filteredProjectsData = useMemo(() => {
    let data = projectsData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((p) => p.projectName.toLowerCase().includes(q));
    }

    const minValue = projectsTimeSaved.min
      ? parseFloat(projectsTimeSaved.min)
      : null;
    const maxValue = projectsTimeSaved.max
      ? parseFloat(projectsTimeSaved.max)
      : null;

    if (minValue !== null) {
      data = data.filter(
        (p) =>
          p.minutesSaved >=
          convertToMinutes(minValue, projectsTimeSaved.unit),
      );
    }
    if (maxValue !== null) {
      data = data.filter(
        (p) =>
          p.minutesSaved <=
          convertToMinutes(maxValue, projectsTimeSaved.unit),
      );
    }

    return data;
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
        <DashboardPageHeader
          title={
            <div className="flex items-center gap-3">
              <ApSidebarToggle />
              <Separator orientation="vertical" className="h-5 mr-2" />
              <span>{t('Leaderboard')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    'See top performers by flows created and time saved',
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          }
        >
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
                    onClick={() => refreshAnalytics()}
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
        </DashboardPageHeader>

        <Tabs
          defaultValue="creators"
          className="w-full"
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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm text-muted-foreground">
                        {t('Minimum')}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={draftTimeSavedMin}
                          onChange={(e) => setDraftTimeSavedMin(e.target.value)}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={cycleDraftTimeUnit}
                          className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
                        >
                          {draftTimeUnit}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm text-muted-foreground">
                        {t('Maximum')}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          placeholder="∞"
                          value={draftTimeSavedMax}
                          onChange={(e) => setDraftTimeSavedMax(e.target.value)}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={cycleDraftTimeUnit}
                          className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
                        >
                          {draftTimeUnit}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={applyTimeSavedFilter}
                      className="w-full mt-1"
                    >
                      {t('Apply')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {timeSavedLabel && (
                <Button
                  variant="link"
                  onClick={clearTimeSavedFilter}
                  size="sm"
                  className="text-muted-foreground px-1"
                >
                  {t('Clear')}
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloadDisabled}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('Download')}
            </Button>
          </div>

          <TabsContent value="creators">
            <UsersLeaderboard
              data={filteredPeopleData}
              isLoading={isLoading}
            />
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
