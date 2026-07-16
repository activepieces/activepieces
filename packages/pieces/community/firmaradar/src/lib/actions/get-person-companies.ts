import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const getPersonCompanies = createAction({
    name: 'get_person_companies',
    auth: firmaradarAuth,
    displayName: 'Get Person Shareholdings',
    description:
        'All companies a person owns shares in, with ownership percentages and ' +
        'share values — map a beneficial owner’s full portfolio.',
    props: {
        ownerPersonKey: Property.ShortText({
            displayName: 'Owner Person Key',
            description: 'Stable owner-person key from Search Persons (`shareholders[].id`).',
            required: true,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/person/shareholdings/${encodeURIComponent(context.propsValue.ownerPersonKey)}`,
        });
    },
});
