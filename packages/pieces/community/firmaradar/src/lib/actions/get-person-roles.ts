import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const getPersonRoles = createAction({
    name: 'get_person_roles',
    auth: firmaradarAuth,
    displayName: 'Get Person Roles',
    description:
        'Complete role history (active + historic) for one person across all ' +
        'companies — the cross-orgnr view behind director screening.',
    props: {
        rolePersonId: Property.ShortText({
            displayName: 'Role Person ID',
            description: 'Stable role-person key from Search Persons (`role_persons[].id`).',
            required: true,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/person/roles/${encodeURIComponent(context.propsValue.rolePersonId)}`,
        });
    },
});
