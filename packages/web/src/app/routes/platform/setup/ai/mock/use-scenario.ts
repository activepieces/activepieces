import { useSearchParams } from 'react-router-dom';

import {
  DEFAULT_SCENARIO_ID,
  MOCK_SCENARIO_IDS,
  MockScenario,
  MockScenarioId,
  SCENARIOS,
} from './fixtures';

export function useScenario(): {
  scenario: MockScenario;
  scenarioId: MockScenarioId;
  setScenarioId: (scenarioId: MockScenarioId) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('scenario');
  const scenarioId = isScenarioId(raw) ? raw : DEFAULT_SCENARIO_ID;

  const setScenarioId = (next: MockScenarioId) => {
    const newParams = new URLSearchParams(searchParams);
    if (next === DEFAULT_SCENARIO_ID) {
      newParams.delete('scenario');
    } else {
      newParams.set('scenario', next);
    }
    setSearchParams(newParams, { replace: true });
  };

  return { scenario: SCENARIOS[scenarioId], scenarioId, setScenarioId };
}

function isScenarioId(value: string | null): value is MockScenarioId {
  return MOCK_SCENARIO_IDS.some((scenarioId) => scenarioId === value);
}
