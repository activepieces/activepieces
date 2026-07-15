import { describe, expect, it } from 'vitest';
import { redditConversionEventUtils } from './event-utils';

describe('redditConversionEventUtils', () => {
  it('sends IP addresses without hashing them', () => {
    expect(
      redditConversionEventUtils.buildUserData({ ip_address: ' 192.0.2.1 ' })
    ).toEqual({ ip_address: '192.0.2.1' });
  });

  it('accepts a URL click ID for website events', () => {
    expect(
      redditConversionEventUtils.hasAttributionSignal({
        props: {
          action_source: 'WEBSITE',
          event_source_url: 'https://example.com/checkout?rdt_cid=click-123',
        },
        user: {},
      })
    ).toBe(true);
  });

  it('does not use a URL click ID for non-website events', () => {
    expect(
      redditConversionEventUtils.hasAttributionSignal({
        props: {
          action_source: 'APP',
          event_source_url: 'https://example.com/checkout?rdt_cid=click-123',
        },
        user: {},
      })
    ).toBe(false);
  });

  it('requires a country when Limited Data Use is enabled', () => {
    expect(() =>
      redditConversionEventUtils.buildDataProcessingOptions({
        limited_data_use: true,
      })
    ).toThrow(
      'Data Processing Country is required when Limited Data Use is enabled.'
    );
  });

  it('includes the fixed LDU mode and normalized location', () => {
    expect(
      redditConversionEventUtils.buildDataProcessingOptions({
        limited_data_use: true,
        dpo_country: ' us ',
        dpo_region: ' us-ca ',
      })
    ).toEqual({ modes: ['LDU'], country: 'US', region: 'US-CA' });
  });

  it('omits data processing options when LDU is disabled', () => {
    expect(
      redditConversionEventUtils.buildDataProcessingOptions({
        limited_data_use: false,
        dpo_country: 'US',
        dpo_region: 'US-CA',
      })
    ).toBeUndefined();
  });
});
