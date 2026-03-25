import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateProject = createAction({
  auth: xeroAuth,
  name: 'xero_create_project',
  displayName: 'Create Project',
  description: 'Creates a new project for a contact.',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(true),
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    deadline_utc: Property.ShortText({
      displayName: 'Deadline (UTC ISO-8601)',
      description: 'Example: 2017-04-23T18:25:43.511Z',
      required: false,
    }),
    estimate_amount: Property.Number({
      displayName: 'Estimate Amount',
      required: false,
    }),
  },
  async run(context) {
    const { tenant_id, contact_id, name, deadline_utc, estimate_amount } =
      context.propsValue;

    const url = 'https://api.xero.com/projects.xro/2.0/Projects';

    const body: Record<string, unknown> = {
      contactId: contact_id,
      name,
      ...(deadline_utc ? { deadlineUtc: deadline_utc } : {}),
      ...(typeof estimate_amount === 'number' ? { estimateAmount: estimate_amount } : {}),
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
        'Content-Type': 'application/json',
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200 || result.status === 201) {
      return result.body;
    }
    return result;
  },
});


