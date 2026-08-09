import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Bot, ChartColumn, Eye, Route, WandSparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { CapabilitiesTab } from './capabilities-tab';
import { ScenarioSwitcher } from './mock/scenario-switcher';
import { useScenario } from './mock/use-scenario';
import { PreviewTab } from './preview-tab';
import { ProvidersTab } from './providers-tab';
import { RoutingTab } from './routing-tab';
import { UsageTab } from './usage-tab';

export default function AIProvidersPage() {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const { scenario, scenarioId, setScenarioId } = useScenario();

  const rawTab = searchParams.get('tab');
  const activeTab = isTabValue(rawTab) ? rawTab : 'providers';

  const setTab = (tab: TabValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'providers') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  const navItems: { value: TabValue; label: string; icon: typeof Bot }[] = [
    { value: 'providers', label: t('Providers'), icon: Bot },
    { value: 'capabilities', label: t('Capabilities'), icon: WandSparkles },
    { value: 'routing', label: t('Model Routing'), icon: Route },
    { value: 'usage', label: t('Usage & Limits'), icon: ChartColumn },
    { value: 'preview', label: t('Preview'), icon: Eye },
  ];

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      <Tabs
        value={activeTab}
        orientation="vertical"
        onValueChange={(value) => {
          const next = TAB_VALUES.find((candidate) => candidate === value);
          if (next) {
            setTab(next);
          }
        }}
        className="flex w-full flex-1 min-h-0"
      >
        <aside className="flex w-60 shrink-0 flex-col min-h-0 border-r">
          <div className="flex flex-col gap-1 px-4 pt-6 pb-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {t('AI Center')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('Providers, model routing, capabilities & spend.')}
            </p>
          </div>
          <TabsList className="flex-col items-stretch h-auto gap-1 bg-transparent p-2">
            {navItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  'w-full justify-start gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground',
                  'hover:bg-sidebar-accent/60 hover:text-foreground',
                  'data-[state=active]:bg-sidebar-accent data-[state=active]:font-medium data-[state=active]:text-foreground',
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </aside>
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="w-full max-w-6xl px-8 py-6">
            <TabsContent value="providers" className="mt-0">
              <ProvidersTab key={scenarioId} scenario={scenario} />
            </TabsContent>
            <TabsContent value="capabilities" className="mt-0">
              <CapabilitiesTab key={scenarioId} scenario={scenario} />
            </TabsContent>
            <TabsContent value="routing" className="mt-0">
              <RoutingTab key={scenarioId} scenario={scenario} />
            </TabsContent>
            <TabsContent value="usage" className="mt-0">
              <UsageTab key={scenarioId} scenario={scenario} />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <PreviewTab key={scenarioId} scenario={scenario} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
      <ScenarioSwitcher scenarioId={scenarioId} onChange={setScenarioId} />
    </LockedFeatureGuard>
  );
}

function isTabValue(value: string | null): value is TabValue {
  return TAB_VALUES.some((tab) => tab === value);
}

const TAB_VALUES = [
  'providers',
  'capabilities',
  'routing',
  'usage',
  'preview',
] as const;

type TabValue = (typeof TAB_VALUES)[number];
