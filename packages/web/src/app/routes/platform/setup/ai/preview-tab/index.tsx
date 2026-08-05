import { t } from 'i18next';

import { MockScenario } from '../mock/fixtures';

export function PreviewTab({ scenario }: { scenario: MockScenario }) {
  return (
    <p className="text-sm text-muted-foreground">
      {t('Preview')} — {scenario.label}
    </p>
  );
}
