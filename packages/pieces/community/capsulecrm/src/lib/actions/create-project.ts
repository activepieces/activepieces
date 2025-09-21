import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { opportunityIdDropdown, partyIdDropdown } from '../common/dropdown';

export const createProject = createAction({
  auth: CapsuleCRMAuth,
  name: 'createProject',
  displayName: 'Create Project',
  description: 'Create a new Project associated with a contact or opportunity in Capsule CRM',
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
    stage: Property.ShortText({
      displayName: 'Stage',
      required: false,
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma separated)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      project: {
        title: propsValue.name,
        party: { id: propsValue.partyId },
        ...(propsValue.opportunityId && { opportunity: { id: propsValue.opportunityId } }),
        status: propsValue.status,
        ...(propsValue.stage && { stage: { id: propsValue.stage } }),
        ...(propsValue.expectedCloseOn && { expectedCloseOn: propsValue.expectedCloseOn }),
        ...(propsValue.tags && {
          tags: propsValue.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean),
        }),
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
