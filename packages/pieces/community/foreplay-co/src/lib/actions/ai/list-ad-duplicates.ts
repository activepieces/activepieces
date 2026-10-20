import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const INTERNAL_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

const listAdDuplicates = createAction({
  auth: foreplayCoAuth,
  name: 'list_ad_duplicates',
  classification: 'SEARCH',
  displayName: 'List Ad Duplicates',
  description: 'Find ads that reuse the same image or video as a given ad.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns every ad in the Foreplay index that uses the same image or video as the given ad (the same creative reused across placements or brands). Pass the public ad library ID: the adId field of any ad list item (not the id field; an internal id returns an empty list). The result includes the given ad itself. Costs 1 credit per ad returned and has no limit parameter, so use it only when creative reuse matters.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adList,
  props: {
    adId: Property.ShortText({ displayName: 'Public Ad ID', description: 'The adId field of an ad from search results (not the internal id).', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = foreplayProps.foreplayId({ value: propsValue.adId, label: 'Public Ad ID' });
    if (INTERNAL_ID_PATTERN.test(id) && !/^\d+$/.test(id)) {
      throw new Error('This looks like a Foreplay internal id. List Ad Duplicates needs the public ad library ID (the adId field of search results).');
    }
    const response = await foreplayClient.request({ auth, path: `/api/ad/duplicates/${foreplayClient.pathId(id)}` });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.ad);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { listAdDuplicates };
