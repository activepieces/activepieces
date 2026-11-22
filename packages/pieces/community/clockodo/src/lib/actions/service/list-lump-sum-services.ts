import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'list_lump_sum_services',
  classification: 'SEARCH',
  displayName: 'Get Lump-Sum Services',
  description: 'Fetches lump-sum services from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.lumpSumServices,
  aiMetadata: {
    description:
      'Lists all Clockodo lump-sum services (fixed-price items such as travel flat rates) with their id, name, price and unit, following every page. Set Only Active to true to skip archived ones. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    active_only: Property.Checkbox({
      displayName: 'Only Active',
      description: 'Only return active lump-sum services',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const lumpSumServices = await makeClient(auth.props).listLumpSumServices({
      active: propsValue.active_only ? true : undefined,
    });
    return {
      lump_sum_services: lumpSumServices,
    };
  },
});
