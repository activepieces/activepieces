import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const addNote = createAction({
    name: 'add_note',
    displayName: 'Add Note to Entity',
    description: 'Add a comment/note to a contact, opportunity, project, or other entity',
    auth: capsuleAuth,
    props: {
        entityType: Property.StaticDropdown({
            displayName: 'Entity Type',
            description: 'Type of entity to add the note to',
            required: true,
            options: {
                options: [
                    { label: 'Party (Contact)', value: 'party' },
                    { label: 'Opportunity', value: 'opportunity' },
                    { label: 'Project', value: 'project' },
                    { label: 'Case', value: 'kase' }
                ]
            }
        }),
        entityId: Property.ShortText({
            displayName: 'Entity ID',
            description: 'ID of the entity to add the note to',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Note Content',
            description: 'Content of the note/comment',
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Note Type',
            description: 'Type of entry/note',
            required: false,
            options: {
                options: [
                    { label: 'Note', value: 'note' },
                    { label: 'Email', value: 'email' },
                    { label: 'Phone Call', value: 'phone_call' },
                    { label: 'Meeting', value: 'meeting' }
                ]
            }
        })
    },
    async run(context) {
        const { entityType, entityId, content, type } = context.propsValue;

        const entry: Record<string, any> = {
            content
        };

        if (type) entry.type = type;

        // Associate with the appropriate entity
        switch (entityType) {
            case 'party':
                entry.party = { id: parseInt(entityId) };
                break;
            case 'opportunity':
                entry.opportunity = { id: parseInt(entityId) };
                break;
            case 'project':
                entry.project = { id: parseInt(entityId) };
                break;
            case 'kase':
                entry.kase = { id: parseInt(entityId) };
                break;
        }

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/entries',
            body: { entry }
        });

        return response.body;
    },
});
