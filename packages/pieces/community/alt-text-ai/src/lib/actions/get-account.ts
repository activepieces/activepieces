import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequest, asNumber, asString, isRecord } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const getAccountAction = createAction({
  name: 'get-account',
  auth: altTextAiAuth,
  displayName: 'Get Account',
  description: 'Retrieves your AltText.ai account usage, credit limit and default language.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the connected AltText.ai account: credits used, credit limit, credits remaining and default alt text language. Use before generating alt text in bulk to check there are enough credits. Free (no credit spent), read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: altTextAiOutputSchemas.account,
  props: {},
  async run(context) {
    const body = await altTextAiRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/account',
      operation: 'Get Account',
    });
    return normalizeAccount(body);
  },
});

function normalizeAccount(raw: unknown) {
  const record = isRecord(raw) ? raw : {};
  const subscription = isRecord(record['subscription']) ? record['subscription'] : {};
  const usage = asNumber(record['usage']);
  const usageLimit = asNumber(record['usage_limit']);
  const spendable = asNumber(record['credits_spendable']);
  const computed = usage !== null && usageLimit !== null ? usageLimit - usage : null;
  return {
    name: asString(record['name']),
    usage,
    usage_limit: usageLimit,
    credits_remaining: spendable ?? computed,
    default_lang: asString(record['default_lang']) ?? asString(record['lang']),
    plan_name: asString(subscription['plan_name']) ?? asString(record['plan_name']),
    renews_at: asString(subscription['expires_at']) ?? asString(record['renews_at']),
  };
}
