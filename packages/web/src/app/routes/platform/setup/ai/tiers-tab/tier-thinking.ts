import { t } from 'i18next';

function presets(): ThinkingPreset[] {
  return [
    { value: 'default', budget: null, label: t('Default') },
    { value: 'off', budget: 0, label: t('Off') },
    { value: 'low', budget: 5_000, label: t('Low (5,000 tokens)') },
    { value: 'medium', budget: 10_000, label: t('Medium (10,000 tokens)') },
    { value: 'high', budget: 20_000, label: t('High (20,000 tokens)') },
  ];
}

function presetOf({
  budget,
}: {
  budget: number | null;
}): ThinkingPreset | undefined {
  return presets().find((preset) => preset.budget === budget);
}

function valueOf({ budget }: { budget: number | null }): string {
  return presetOf({ budget })?.value ?? CUSTOM_VALUE;
}

function budgetOf({
  value,
  current,
}: {
  value: string;
  current: number | null;
}): number | null {
  if (value === CUSTOM_VALUE) {
    return current;
  }
  return presets().find((preset) => preset.value === value)?.budget ?? null;
}

function chipLabel({ budget }: { budget: number | null }): string | undefined {
  if (budget === null) {
    return undefined;
  }
  const preset = presetOf({ budget });
  if (preset === undefined) {
    return t('Thinking: {budget}', { budget: budget.toLocaleString() });
  }
  return t('Thinking: {level}', { level: shortLabel({ value: preset.value }) });
}

function shortLabel({ value }: { value: string }): string {
  switch (value) {
    case 'off':
      return t('Off');
    case 'low':
      return t('Low');
    case 'medium':
      return t('Medium');
    case 'high':
      return t('High');
    default:
      return t('Default');
  }
}

export const tierThinking = {
  presets,
  presetOf,
  valueOf,
  budgetOf,
  chipLabel,
  CUSTOM_VALUE: 'custom',
};

const CUSTOM_VALUE = 'custom';

export type ThinkingPreset = {
  value: 'default' | 'off' | 'low' | 'medium' | 'high';
  budget: number | null;
  label: string;
};
