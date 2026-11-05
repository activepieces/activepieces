import { createAction } from '@activepieces/pieces-framework';
import { tariffsApiAuth } from '../auth';
import { apiKeyOf, tariffsApiGet } from '../common/client';
import { asOfProp, htsProp, originProp, unknownDatesProp } from '../common/props';

export const getByHtsAction = createAction({
  auth: tariffsApiAuth,
  name: 'get_by_hts',
  classification: 'READ',
  displayName: 'Get Duties by HTS Code',
  description: 'Get base duties and additional measures for one HTS code, optionally filtered by origin.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns base duties and additional measures for one HTS code. Origin is optional and only filters additional duties. Use Resolve Tariff instead when you need the duty picture for a known country of origin, including optional Chapter 99 numeric rates. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    hts: htsProp,
    origin: originProp(false),
    as_of: asOfProp,
    include_unknown_effective_dates: unknownDatesProp,
  },
  async run({ auth, propsValue }) {
    return tariffsApiGet({
      apiKey: apiKeyOf(auth),
      path: `/tariffs/by_hts/${encodeURIComponent(propsValue.hts)}`,
      query: {
        origin: propsValue.origin,
        as_of: propsValue.as_of,
        include_unknown_effective_dates: propsValue.include_unknown_effective_dates,
      },
    });
  },
});
