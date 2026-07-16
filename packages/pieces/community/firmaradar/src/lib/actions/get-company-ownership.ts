import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompanyOwnership = createAction({
    name: 'get_company_ownership',
    auth: firmaradarAuth,
    displayName: 'Get Company Ownership',
    description:
        'Ownership tree for UBO discovery and group mapping — traverse who owns ' +
        'the company (up), what it owns (down), or both.',
    props: {
        orgnr: orgnrProp(),
        direction: Property.StaticDropdown({
            displayName: 'Direction',
            required: false,
            defaultValue: 'down',
            options: {
                options: [
                    { label: 'Down (subsidiaries)', value: 'down' },
                    { label: 'Up (owners / UBO)', value: 'up' },
                    { label: 'Both', value: 'both' },
                ],
            },
        }),
        depth: Property.Number({
            displayName: 'Depth',
            description: 'Number of levels to traverse (1-10).',
            required: false,
            defaultValue: 5,
        }),
        includePersons: Property.Checkbox({
            displayName: 'Include Person Owners',
            description: 'Include natural-person owners (requires full-ownership access).',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/ownership`,
            query: {
                direction: context.propsValue.direction,
                depth: context.propsValue.depth,
                include_persons: context.propsValue.includePersons ? 1 : 0,
            },
        });
    },
});
