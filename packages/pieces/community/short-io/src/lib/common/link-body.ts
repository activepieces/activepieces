import { shortIoValues } from './values';

const REDIRECT_TYPES = ['301', '302', '303', '307', '308'];

function validateLinkOptions({ clicksLimit, splitPercent, redirectType }: { clicksLimit: unknown; splitPercent: unknown; redirectType: unknown }): {
  clicksLimit?: number;
  splitPercent?: number;
  redirectType?: number;
} {
  const clicks = shortIoValues.optionalNumber({ value: clicksLimit, label: 'Clicks limit', min: 1 });
  if (clicks !== undefined && !Number.isInteger(clicks)) {
    throw new Error('Clicks limit must be a whole number.');
  }
  const split = shortIoValues.optionalNumber({ value: splitPercent, label: 'Split percent', min: 1, max: 100 });
  let redirect: number | undefined;
  if (redirectType !== undefined && redirectType !== null && redirectType !== '') {
    if (!REDIRECT_TYPES.includes(String(redirectType))) {
      throw new Error(`Invalid redirect type. Must be one of: ${REDIRECT_TYPES.join(', ')}`);
    }
    redirect = Number(redirectType);
  }
  return { clicksLimit: clicks, splitPercent: split, redirectType: redirect };
}

function legacyLinkBody({ values, now }: { values: Record<string, unknown>; now: number }): Record<string, unknown> {
  const { clicksLimit, splitPercent, redirectType } = validateLinkOptions({
    clicksLimit: values['clicksLimit'],
    splitPercent: values['splitPercent'],
    redirectType: values['redirectType'],
  });
  const ttlSeconds = shortIoValues.optionalNumber({ value: values['ttl'], label: 'Time to Live' });
  const tags = values['tags'] === undefined || values['tags'] === null ? undefined : shortIoValues.stringList(values['tags']);
  return shortIoValues.compact({
    ...values,
    domain: undefined,
    linkId: undefined,
    tags,
    clicksLimit,
    splitPercent,
    redirectType,
    ttl: ttlSeconds === undefined ? undefined : shortIoValues.ttlSecondsToDeleteAt({ seconds: ttlSeconds, now }),
  });
}

export const shortIoLinkBody = { validateLinkOptions, legacyLinkBody, REDIRECT_TYPES };
