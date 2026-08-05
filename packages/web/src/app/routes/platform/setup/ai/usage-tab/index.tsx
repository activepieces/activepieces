import { t } from 'i18next';

import { MockScenario } from '../mock/fixtures';

export function UsageTab({ scenario }: { scenario: MockScenario }) {
  return (
    <p className="text-sm text-muted-foreground">
      {t('Usage & Limits')} — {scenario.label}
    </p>
  );
}
