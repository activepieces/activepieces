import { ghostCommon } from './client';
import { ghostResource } from './resources';
import { TIER_FIELDS } from './tier-props';

export const tierBody = (props: Record<string, unknown>) => {
  const body = ghostResource.pick(props, TIER_FIELDS);
  for (const key of ['monthly_price', 'yearly_price', 'trial_days']) {
    if (body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${key} must be a whole number of 0 or more.`);
      }
      body[key] = value;
    }
  }
  const currency = body['currency'];
  if (typeof currency === 'string') {
    body['currency'] = currency.toLowerCase();
  }
  if (Array.isArray(props['benefits'])) {
    body['benefits'] = ghostCommon.stringList(props['benefits']) ?? [];
  }
  return body;
};
