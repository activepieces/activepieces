import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';
import { IssueClasses } from '../common/constants';

export const createMilestone = createAction({
    auth: hulyIoAuth,
    name: 'create_milestone',
    displayName: 'Create Milestone',
    description: 'Create a milestone in a project',
    props: {
        _class: Property.StaticDropdown({
            displayName: 'Class',
            description: 'The class of the object to create',
            required: true,
            options: {
                options: [
                    { label: 'Milestone', value: IssueClasses.Milestone }
                ]
            },
            defaultValue: IssueClasses.Milestone
        }),
        space: Property.ShortText({
            displayName: 'Space',
            description: 'The space (project ID) to create the object in',
            required: true,
        }),
        attributes: Property.Object({
            displayName: 'Attributes',
            description: 'The attributes of the object to create (name, description, dueDate, issueIds, etc.)',
            required: true,
        })
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);

        try {
            const milestoneId = await client.createDoc(
                propsValue._class,
                propsValue.space,
                propsValue.attributes
            );

            await client.disconnect();
            return { id: milestoneId };
        } catch (error) {
            await client.disconnect();
            throw error;
        }
    },
});
