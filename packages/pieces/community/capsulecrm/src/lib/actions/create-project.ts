import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { opportunityIdDropdown, partyIdDropdown } from '../common/dropdown';

export const createProject = createAction({
  auth: CapsuleCRMAuth,
  name: 'createProject',
  displayName: 'Create Project (Case)',
  description: 'Create a new Case (Project) associated with a contact or opportunity in Capsule CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Project Title',
      required: true,
    }),
    partyId: partyIdDropdown,
    opportunityId: opportunityIdDropdown,

    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Open', value: 'OPEN' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date (YYYY-MM-DD)',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma separated)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      kase: {
        name: propsValue.name, // Capsule API uses "name" for case title
        status: propsValue.status,
        party: propsValue.partyId ? { id: propsValue.partyId } : undefined,
        opportunity: propsValue.opportunityId ? { id: propsValue.opportunityId } : undefined,
        expectedCloseOn: propsValue.expectedCloseOn || undefined,
        tags: propsValue.tags
          ? propsValue.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
          : undefined,
      },
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/kases',
      body
    );

    return response;
  },
});

