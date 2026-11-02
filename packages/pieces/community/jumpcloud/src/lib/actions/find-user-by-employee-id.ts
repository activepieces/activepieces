import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { findUserOutputSchema } from '../output-schemas';

export const findUserByEmployeeIdAction = createAction({
    auth: jumpcloudAuth,
    name: 'find_user_by_employee_id',
    classification: 'SEARCH',
    displayName: 'Search User by Employee ID',
    description: 'Find the JumpCloud user with an exact employee ID, for example one sent by your HR system.',
    audience: 'both',
    aiMetadata: {
        description:
            'Looks up the JumpCloud user whose employeeIdentifier exactly matches the given value (case-sensitive) and returns found plus the user fields, or found=false with empty fields. Use Search Objects for partial or other-field matches. Safe to retry.',
        idempotent: true,
    },
    props: {
        employeeId: Property.ShortText({
            displayName: 'Employee ID',
            description: 'The exact employee ID stored on the user in JumpCloud. Matching is case-sensitive.',
            required: true,
        }),
    },
    outputSchema: findUserOutputSchema,
    async run(context) {
        const employeeId = context.propsValue.employeeId.trim();
        if (employeeId.length === 0) {
            throw new Error('Enter the Employee ID to search for.');
        }
        const page = await jumpcloudObjects.listPage({
            auth: context.auth.props,
            type: 'user',
            page: { limit: 2, skip: 0 },
            filter: `employeeIdentifier:$eq:${employeeId}`,
        });
        const [user] = page.items;
        return { found: user !== undefined, ...jumpcloudOutput.flatten({ type: 'user', record: user ?? {} }) };
    },
});
