import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const findRelatedCompanies = createAction({
    name: 'find_related_companies',
    auth: firmaradarAuth,
    displayName: 'Find Related Companies',
    description:
        'Companies sharing role holders, business address or significant owners ' +
        '(≥10 %) with a source company — expand a KYC case to its network.',
    props: {
        orgnr: orgnrProp(),
        via: Property.StaticDropdown({
            displayName: 'Relation Type',
            required: false,
            defaultValue: 'person',
            options: {
                options: [
                    { label: 'Shared person (role holder)', value: 'person' },
                    { label: 'Same address', value: 'address' },
                    { label: 'Shared owner (≥10 %)', value: 'owner' },
                ],
            },
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of related companies (1-100).',
            required: false,
            defaultValue: 25,
        }),
        minOverlap: Property.Number({
            displayName: 'Minimum Overlap',
            description: 'Minimum number of shared persons/owners to count as related.',
            required: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/related`,
            query: {
                via: context.propsValue.via,
                limit: context.propsValue.limit,
                min_overlap: context.propsValue.minOverlap,
            },
        });
    },
});
