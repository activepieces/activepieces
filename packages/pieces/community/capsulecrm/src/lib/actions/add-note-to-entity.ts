import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyIdDropdown, opportunityIdDropdown, projectIdDropdown, ownerIdDropdown } from '../common/dropdown';

export const addNoteToEntity = createAction({
  auth: CapsuleCRMAuth,
  name: 'addNoteToEntity',
  displayName: 'Add Note to Entity',
  description: 'Add a comment/note to a contact, opportunity, or project in Capsule CRM',
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      required: true,
    }),
    partyId: partyIdDropdown,
    opportunityId: opportunityIdDropdown,
    projectId: projectIdDropdown,
    ownerId: ownerIdDropdown,
  },
  async run({ auth, propsValue }) {
    const body: any = {
      entry: {
        type: 'note',
        content: propsValue.content,
        party: { id: propsValue.partyId },
        ...(propsValue.opportunityId && { opportunity: { id: propsValue.opportunityId } }),
        ...(propsValue.projectId && { project: { id: propsValue.projectId } }),
        ...(propsValue.ownerId && { owner: { id: propsValue.ownerId } }),
      },
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/entries',
      body
    );

    return response;
  },
});
