import { t } from 'i18next';

import { MockScenario } from '../mock/fixtures';

export function RoutingTab({ scenario }: { scenario: MockScenario }) {
  return (
    <p className="text-sm text-muted-foreground">
      {t('Model Routing')} — {scenario.label}
    </p>
  );
}
