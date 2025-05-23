import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';
import { IssueClasses } from '../common/constants';

export const createIssue = createAction({
    auth: hulyIoAuth,
    name: 'create_issue',
    displayName: 'Create Issue',
    description: 'Create a new issue under a project',
    props: {
        _class: Property.StaticDropdown({
            displayName: 'Class',
            description: 'The class of the object to create',
            required: true,
            options: {
                options: [
                    { label: 'Issue', value: IssueClasses.Issue }
                ]
            },
            defaultValue: IssueClasses.Issue
        }),
        space: Property.ShortText({
            displayName: 'Space',
            description: 'The space (project ID) to create the object in',
            required: true,
        }),
        attributes: Property.Object({
            displayName: 'Attributes',
            description: 'The attributes of the object to create (title, description, priority, etc.)',
            required: true,
        })
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);

        try {
            const issueId = await client.createDoc(
                propsValue._class,
                propsValue.space,
                propsValue.attributes
            );

            await client.disconnect();
            return { id: issueId };
        } catch (error) {
            await client.disconnect();
            throw error;
        }
    },
});
