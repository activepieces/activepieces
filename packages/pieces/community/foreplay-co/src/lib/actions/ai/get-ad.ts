import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const getAd = createAction({
  auth: foreplayCoAuth,
  name: 'get_ad',
  classification: 'READ',
  displayName: 'Get Ad',
  description: 'Get one ad by its public ad library ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the full details of one ad: copy, headline, CTA, landing page, media URLs, transcription, platforms, niches, live status and the Open in Foreplay link. Pass the public ad library ID: the adId field of any ad list item (not the id field, which is the Foreplay internal id and is not accepted here). Costs 1 credit.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.ad,
  props: {
    adId: Property.ShortText({ displayName: 'Public Ad ID', description: 'The adId field of an ad from search results (not the internal id).', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = foreplayProps.foreplayId({ value: propsValue.adId, label: 'Public Ad ID' });
    const response = await foreplayClient.request({ auth, path: `/api/ad/${foreplayClient.pathId(id)}` });
    return foreplayMappers.single({ response, map: foreplayMappers.ad });
  },
});

export { getAd };
