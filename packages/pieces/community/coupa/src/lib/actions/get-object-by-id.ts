import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  customModuleResourceProperty,
  moduleProperty,
  objectSelector,
  optionalQueryParamsProperty,
  parseOptionalQuery,
  resolveModuleResource,
  toCoupaModule,
} from '../common/props';
import { formatCoupaOutput } from '../common/utils';

export const getObjectById = createAction({
  auth: coupaAuth,
  name: 'get_object_by_id',
  displayName: 'Get Object by ID',
  description:
    'Retrieves a single record by ID from Purchase Orders, Suppliers, or Contracts.',
  props: {
    module: moduleProperty,
    customResource: customModuleResourceProperty,
    record: objectSelector,
    queryParams: optionalQueryParamsProperty,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const resource = resolveModuleResource(
      propsValue.module,
      propsValue.customResource
    );
    const objectId = propsValue.record['objectId'];
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.GET,
      resourceUri: `/${resource}/${objectId}`,
      query: parseOptionalQuery(propsValue.queryParams),
    });
    if (propsValue.module !== '__custom__') {
      return formatCoupaOutput(result, toCoupaModule(propsValue.module));
    }
    return result;
  },
});
