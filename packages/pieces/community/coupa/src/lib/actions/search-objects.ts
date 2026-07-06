import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  customModuleResourceProperty,
  moduleProperty,
  optionalQueryParamsProperty,
  parseOptionalQuery,
  resolveModuleResource,
  toCoupaModule,
} from '../common/props';
import { formatCoupaOutputs } from '../common/utils';

export const searchObjects = createAction({
  auth: coupaAuth,
  name: 'search_objects',
  displayName: 'Search Objects (Batch)',
  description:
    'Searches records in a Coupa module with pagination (50 per page) and returns standardized fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search and list records in a Coupa module — purchase orders, suppliers, contracts, or any other resource via the custom-module option — using optional Coupa query parameters as filters, auto-paginating through all matching pages. Use this to find records by criteria; use Get Object by ID when you already have an ID. Read-only and idempotent, but unfiltered searches on large modules can be slow.',
    idempotent: true,
  },
  props: {
    module: moduleProperty,
    customResource: customModuleResourceProperty,
    queryParams: optionalQueryParamsProperty,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const resource = resolveModuleResource(
      propsValue.module,
      propsValue.customResource
    );
    const query = parseOptionalQuery(propsValue.queryParams);
    const records = await client.fetchAllRecords(resource, query);

    if (propsValue.module !== '__custom__') {
      const coupaModule = toCoupaModule(propsValue.module);
      const formatted = formatCoupaOutputs(records, coupaModule);
      return {
        total_count: formatted.length,
        records: formatted,
      };
    }

    return {
      total_count: records.length,
      records,
    };
  },
});
