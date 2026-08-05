import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Bot, ChartColumn, Eye, Route, WandSparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userHooks } from '@/hooks/user-hooks';

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

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      <div className="flex flex-col gap-1 px-6 pt-6 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{t('AI Hub')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            'Everything AI on your platform — providers, model routing, assistant capabilities, and spend.',
          )}
        </p>
      </div>
      <div className="mx-auto w-full flex flex-col flex-1 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const next = TAB_VALUES.find((candidate) => candidate === value);
            if (next) {
              setTab(next);
            }
          }}
          className="flex flex-col flex-1 min-h-0 min-w-0"
        >
          <TabsList
            variant="outline"
            className="border-b w-full rounded-none justify-start shrink-0 gap-2 px-6"
          >
            <TabsTrigger
              variant="outline"
              value="providers"
              className="px-4 py-2.5"
            >
              <Bot className="size-4 mr-2" />
              {t('Providers')}
            </TabsTrigger>
            <TabsTrigger
              variant="outline"
              value="capabilities"
              className="px-4 py-2.5"
            >
              <WandSparkles className="size-4 mr-2" />
              {t('Capabilities')}
            </TabsTrigger>
            <TabsTrigger
              variant="outline"
              value="routing"
              className="px-4 py-2.5"
            >
              <Route className="size-4 mr-2" />
              {t('Model Routing')}
            </TabsTrigger>
            <TabsTrigger
              variant="outline"
              value="usage"
              className="px-4 py-2.5"
            >
              <ChartColumn className="size-4 mr-2" />
              {t('Usage & Limits')}
            </TabsTrigger>
            <TabsTrigger
              variant="outline"
              value="preview"
              className="px-4 py-2.5"
            >
              <Eye className="size-4 mr-2" />
              {t('Preview')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="providers" className="flex-1 min-h-0 mt-0">
            <div className="w-full max-w-5xl px-6 py-6">
              <ProvidersTab key={scenarioId} scenario={scenario} />
            </div>
          </TabsContent>
          <TabsContent value="capabilities" className="flex-1 min-h-0 mt-0">
            <div className="w-full max-w-5xl px-6 py-6">
              <CapabilitiesTab key={scenarioId} scenario={scenario} />
            </div>
          </TabsContent>
          <TabsContent value="routing" className="flex-1 min-h-0 mt-0">
            <div className="w-full max-w-5xl px-6 py-6">
              <RoutingTab key={scenarioId} scenario={scenario} />
            </div>
          </TabsContent>
          <TabsContent value="usage" className="flex-1 min-h-0 mt-0">
            <div className="w-full px-6 py-6">
              <UsageTab key={scenarioId} scenario={scenario} />
            </div>
          </TabsContent>
          <TabsContent value="preview" className="flex-1 min-h-0 mt-0">
            <div className="w-full px-6 py-6">
              <PreviewTab key={scenarioId} scenario={scenario} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
