import { t } from 'i18next';
import { FlaskConical } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { MOCK_SCENARIO_IDS, MockScenarioId, SCENARIOS } from './fixtures';

export function ScenarioSwitcher({
  scenarioId,
  onChange,
}: {
  scenarioId: MockScenarioId;
  onChange: (scenarioId: MockScenarioId) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-card p-2 shadow-md">
      <FlaskConical className="size-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">
        {t('Demo scenario')}
      </span>
      <Select
        value={scenarioId}
        onValueChange={(value) => {
          const next = MOCK_SCENARIO_IDS.find(
            (candidate) => candidate === value,
          );
          if (next) {
            onChange(next);
          }
        }}
      >
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOCK_SCENARIO_IDS.map((id) => (
            <SelectItem key={id} value={id}>
              {SCENARIOS[id].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
