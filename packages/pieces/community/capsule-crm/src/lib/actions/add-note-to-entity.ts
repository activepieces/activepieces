import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyDropdown, opportunityDropdown, kaseDropdown } from '../common/props';

export const addNoteToEntity = createAction({
    auth: capsuleCrmAuth,
    name: 'add_note_to_entity',
    displayName: 'Add Note to Entity',
    description: 'Add a comment/note to an entity (e.g., contact, opportunity, project).',
    props: {
        content: Property.LongText({
            displayName: 'Note Content',
            description: 'The content of the note to add.',
            required: true,
        }),
        partyId: partyDropdown,
        opportunityId: opportunityDropdown,
        kaseId: kaseDropdown,
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { content, partyId, opportunityId, kaseId } = propsValue;

        const selectedEntities = [partyId, opportunityId, kaseId].filter(id => id);

        if (selectedEntities.length === 0) {
            throw new Error("Validation Error: Please select one entity (Contact, Opportunity, or Project) to add the note to.");
        }
        
        if (selectedEntities.length > 1) {
            throw new Error("Validation Error: Please select only ONE entity (Contact, Opportunity, or Project) to add the note to. You have selected more than one.");
        }

        const entryPayload: { [key: string]: any } = {
            type: 'note',
            content: content,
        };

        if (partyId) {
            entryPayload['party'] = { id: partyId };
        } else if (opportunityId) {
            entryPayload['opportunity'] = { id: opportunityId };
        } else if (kaseId) {
            entryPayload['kase'] = { id: kaseId };
        }

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/entries',
            { entry: entryPayload }
        );

        return response;
    },
});