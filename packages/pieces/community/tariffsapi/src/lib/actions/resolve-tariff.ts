import { createAction, Property } from '@activepieces/pieces-framework';
import { tariffsApiAuth } from '../auth';
import { apiKeyOf, tariffsApiGet } from '../common/client';
import { asOfProp, htsProp, originProp, unknownDatesProp } from '../common/props';

export const resolveTariffAction = createAction({
  auth: tariffsApiAuth,
  name: 'resolve_tariff',
  displayName: 'Resolve Tariff',
  description: 'Get base duty plus additional measures (e.g. Section 301/232) for an HTS code and country of origin.',
  props: {
    hts: htsProp,
    origin: originProp(true),
    as_of: asOfProp,
    include_unknown_effective_dates: unknownDatesProp,
    resolve_chapter_99: Property.Checkbox({
      displayName: 'Resolve Chapter 99',
      description: 'Resolve reference-only measures (e.g. "See 9903.91.05") to numeric rates.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return tariffsApiGet(apiKeyOf(auth), '/tariffs/resolve', {
      hts: propsValue.hts,
      origin: propsValue.origin,
      as_of: propsValue.as_of,
      include_unknown_effective_dates: propsValue.include_unknown_effective_dates,
      resolve_chapter_99: propsValue.resolve_chapter_99,
    });
  },
});
