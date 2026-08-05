import { t } from 'i18next';
import { OctagonAlert } from 'lucide-react';
import { useState } from 'react';

import { SidebarAiUsage } from '@/app/components/sidebar/sidebar-ai-usage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TierModelPicker,
  TierModelValue,
} from '@/features/agents/ai-model/tier-model-picker';

import { MODEL_CATALOG, MockScenario } from '../mock/fixtures';

import { AgentPanelFrame } from './agent-panel-frame';

export function PreviewTab({ scenario }: { scenario: MockScenario }) {
  const [pickerValue, setPickerValue] = useState<TierModelValue | null>(
    scenario.routing.tiers.length > 0
      ? {
          kind: 'tier',
          id: scenario.routing.tiers[1]?.id ?? scenario.routing.tiers[0].id,
        }
      : null,
  );

  const tierOptions = scenario.routing.tiers.map(
    ({ id, name, description }) => ({ id, name, description }),
  );

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        {t(
          'How the routing and limit features show up outside this page. Each frame is rendered at its real size.',
        )}
      </p>
      <div className="flex flex-wrap items-start gap-8">
        <PreviewFrame caption={t('As seen in: builder step settings')}>
          <AgentPanelFrame>
            <TierModelPicker
              tiers={tierOptions}
              models={MODEL_CATALOG}
              value={pickerValue}
              onChange={setPickerValue}
            />
          </AgentPanelFrame>
        </PreviewFrame>
        <PreviewFrame caption={t('As seen in: project sidebar')}>
          <div className="w-60">
            <SidebarAiUsage
              used={scenario.currentProject.creditsUsed}
              limit={scenario.currentProject.limit}
            />
          </div>
        </PreviewFrame>
        <PreviewFrame caption={t('As seen in: chat and AI steps at the limit')}>
          <div className="w-[380px]">
            <Alert variant="destructive">
              <OctagonAlert className="size-4" />
              <AlertTitle>{t('AI limit reached')}</AlertTitle>
              <AlertDescription>
                {t(
                  'This project hit its AI limit for the month. Contact your platform admin to raise it.',
                )}
              </AlertDescription>
            </Alert>
          </div>
        </PreviewFrame>
      </div>
    </div>
  );
}

function PreviewFrame({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {caption}
      </p>
      {children}
    </div>
  );
}
