import { createAction } from '@activepieces/pieces-framework';
import { tariffsApiAuth } from '../auth';
import { apiKeyOf, tariffsApiGet } from '../common/client';
import { asOfProp, htsProp, originProp, unknownDatesProp } from '../common/props';

export const getByHtsAction = createAction({
  auth: tariffsApiAuth,
  name: 'get_by_hts',
  displayName: 'Get Duties by HTS Code',
  description: 'Get base duties and additional measures for one HTS code, optionally filtered by origin.',
  props: {
    hts: htsProp,
    origin: originProp(false),
    as_of: asOfProp,
    include_unknown_effective_dates: unknownDatesProp,
  },
  async run({ auth, propsValue }) {
    return tariffsApiGet(apiKeyOf(auth), `/tariffs/by_hts/${encodeURIComponent(propsValue.hts)}`, {
      origin: propsValue.origin,
      as_of: propsValue.as_of,
      include_unknown_effective_dates: propsValue.include_unknown_effective_dates,
    });
  },
});
