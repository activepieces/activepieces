import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayProps } from '../common/props';

const getAdById = createAction({
  auth: foreplayCoAuth,
  name: 'getAdById',
  classification: 'READ',
  displayName: 'Get Ad by ID',
  description: 'Get detailed information about a specific ad by its public ad library ID. Costs 1 Foreplay credit.',
  audience: 'human',
  aiMetadata: {
    description: 'Fetch one Foreplay ad by its public ad library ID (the ad_id field of ads returned by other Foreplay steps, not the internal id) and return the raw ad object. Costs 1 credit.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rawAd,
  props: {
    ad_id: Property.ShortText({ displayName: 'Public Ad ID', description: 'The public ad library ID: the ad_id field of ads returned by other Foreplay steps (not the internal id field).', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = foreplayProps.foreplayId({ value: propsValue.ad_id, label: 'Public Ad ID' });
    const response = await foreplayClient.request({ auth, path: `/api/ad/${foreplayClient.pathId(id)}` });
    const data = foreplayMappers.dataOf(response.body);
    const item = Array.isArray(data) ? data[0] : data;
    if (item === null || item === undefined || typeof item !== 'object') throw new Error(foreplayMappers.notFoundMessage);
    return item;
  },
});

export { getAdById };
