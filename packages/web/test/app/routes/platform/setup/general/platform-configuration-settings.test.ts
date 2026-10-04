import { readFileSync } from 'fs';
import path from 'path';

import { PlatformConfigurationSettings } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

const translations: Record<string, string> = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      '../../../../../../public/locales/en/translation.json',
    ),
    'utf-8',
  ),
);

const messageFor = (maxBarrierSignals: unknown): string => {
  const result = PlatformConfigurationSettings.safeParse({
    isProductTelemetryEnabled: true,
    isInfraSetupTelemetryEnabled: true,
    maxBarrierSignals,
  });
  expect(result.success).toBe(false);
  return result.error!.issues[0].message;
};

describe('configurations form schema', () => {
  it.each([
    ['an empty field', undefined, 'Required'],
    ['a fractional cap', 1.5, 'Must be a whole number'],
    ['a non-numeric cap', 'abc', 'Must be a whole number'],
    ['a cap below the floor', 0, 'Must be at least 1'],
    ['a cap above the ceiling', 10_001, 'Must be at most 10,000'],
  ])(
    'renders readable English for %s instead of a raw zod message',
    (_case, input, expected) => {
      const message = messageFor(input);

      expect(translations[message]).toBe(expected);
    },
  );

  it('accepts a cap sitting on each bound', () => {
    for (const maxBarrierSignals of [1, 10_000]) {
      expect(
        PlatformConfigurationSettings.safeParse({
          isProductTelemetryEnabled: true,
          isInfraSetupTelemetryEnabled: true,
          maxBarrierSignals,
        }).success,
      ).toBe(true);
    }
  });
});
