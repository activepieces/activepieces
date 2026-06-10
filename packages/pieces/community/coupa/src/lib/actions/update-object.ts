import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  customModuleResourceProperty,
  moduleProperty,
  objectSelector,
  requestBodyHelp,
  requestBodyProperty,
  resolveModuleResource,
  toCoupaModule,
} from '../common/props';
import { formatCoupaOutput, parseJsonBody } from '../common/utils';

export const updateObject = createAction({
  auth: coupaAuth,
  name: 'update_object',
  displayName: 'Update Object',
  description:
    'Updates a record by ID in the selected Coupa module (Purchase Orders, Suppliers, or Contracts).',
  props: {
    module: moduleProperty,
    customResource: customModuleResourceProperty,
    record: objectSelector,
    bodyHelp: requestBodyHelp,
    body: requestBodyProperty,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const resource = resolveModuleResource(
      propsValue.module,
      propsValue.customResource
    );
    const objectId = propsValue.record['objectId'];
    const body = parseJsonBody(propsValue.body);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/${resource}/${objectId}`,
      body,
    });
    if (propsValue.module !== '__custom__') {
      return formatCoupaOutput(result, toCoupaModule(propsValue.module));
    }
    return result;
  },
});
