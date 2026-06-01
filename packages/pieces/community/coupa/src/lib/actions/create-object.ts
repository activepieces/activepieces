import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  customModuleResourceProperty,
  moduleProperty,
  requestBodyHelp,
  requestBodyProperty,
  resolveModuleResource,
  toCoupaModule,
} from '../common/props';
import { formatCoupaOutput, parseJsonBody } from '../common/utils';

export const createObject = createAction({
  auth: coupaAuth,
  name: 'create_object',
  displayName: 'Create Object',
  description:
    'Creates a record in the selected Coupa module (Purchase Orders, Suppliers, or Contracts).',
  props: {
    module: moduleProperty,
    customResource: customModuleResourceProperty,
    bodyHelp: requestBodyHelp,
    body: requestBodyProperty,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const resource = resolveModuleResource(
      propsValue.module,
      propsValue.customResource
    );
    const body = parseJsonBody(propsValue.body);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.POST,
      resourceUri: `/${resource}`,
      body,
    });
    if (propsValue.module !== '__custom__') {
      return formatCoupaOutput(result, toCoupaModule(propsValue.module));
    }
    return result;
  },
});
