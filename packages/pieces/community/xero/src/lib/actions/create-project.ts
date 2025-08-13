import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createProject = createAction({
  auth: xeroAuth,
  name: 'createProject',
  displayName: 'Create Project',
  description: 'Creates a new project for a contact in Xero',
  props: {
    tenant_id: props.tenant_id, // Tenant dropdown to select the organization
    contact_id: props.contact_id(true), // Contact ID is required
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project',
      required: true,
    }),
    deadline: Property.ShortText({
      displayName: 'Deadline',
      description:
        'The deadline for the project (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    estimateAmount: Property.Number({
      displayName: 'Estimate Amount',
      description: 'The estimated amount for the project. Optional.',
      required: false,
    }),
    estimateCurrency: Property.ShortText({
      displayName: 'Estimate Currency',
      description:
        'The currency for the estimated amount (e.g., USD, NZD). Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const projectData: any = {
      contactId: propsValue.contact_id,
      name: propsValue.name,
      ...(propsValue.deadline && {
        deadlineUtc: `${propsValue.deadline}T00:00:00Z`,
      }),
      ...(propsValue.estimateAmount && {
        estimateAmount: {
          amount: propsValue.estimateAmount,
          ...(propsValue.estimateCurrency && {
            currency: propsValue.estimateCurrency,
          }),
        },
      }),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/projects',
      projectData,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
