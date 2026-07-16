import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompany = createAction({
    name: 'get_company',
    auth: firmaradarAuth,
    displayName: 'Get Company',
    description:
        'Full decision-ready company profile — group structure, owners, grants, ' +
        'announcements and financial metrics in one call. Use the field selector ' +
        'to enrich only the sections your flow needs.',
    props: {
        orgnr: orgnrProp(),
        fields: Property.StaticMultiSelectDropdown({
            displayName: 'Extra Sections',
            description:
                'Optional sections to enrich the profile with. "IP rights" fetches ' +
                'patents, trademarks and designs from the Norwegian Industrial ' +
                'Property Office (slower — external lookup).',
            required: false,
            options: {
                options: [
                    { label: 'Group structure', value: 'group' },
                    { label: 'Owners (business)', value: 'business_owners' },
                    { label: 'Owners (all, incl. persons)', value: 'full_owners' },
                    { label: 'Owners', value: 'owners' },
                    { label: 'Public grants', value: 'grants' },
                    { label: 'BRREG grants', value: 'brreg_grants' },
                    { label: 'Recent changes', value: 'changes' },
                    { label: 'Financial metrics', value: 'financial_metrics' },
                    { label: 'IP rights (Patentstyret)', value: 'ip' },
                ],
            },
        }),
    },
    async run(context) {
        const fields = (context.propsValue.fields ?? []) as string[];
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}`,
            query: {
                fields: fields.length > 0 ? fields.join(',') : undefined,
            },
        });
    },
});
