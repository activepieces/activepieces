import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { findCompanyBy } from '../common/lookups';
import { findCompanyOutputSchema } from '../output-schemas';

export const findCompanyAction = createAction({
    auth: intercomAuth,
    name: 'find-company',
    classification: 'READ',
    displayName: 'Find Company',
    description: 'Finds an existing company.',
    audience: 'both',
    aiMetadata: { description: 'Look up a single existing company by its exact name or your own Company ID (choose the search field). Returns found=false when nothing matches; a name lookup only finds companies that already have a contact attached; the company is under "company" ("user" is a legacy copy). Read-only and safe to retry.', idempotent: true },
    props: {
        searchField: Property.StaticDropdown({
            displayName: 'Search Field',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'Company ID', value: 'company_id' },
                ],
            },
        }),
        searchValue: Property.ShortText({
            displayName: 'Search Value',
            required: true,
        }),
    },
    outputSchema: findCompanyOutputSchema,
    async run(context) {
        const { searchField, searchValue } = context.propsValue;

        const company = await findCompanyBy({
            auth: context.auth,
            field: searchField === 'company_id' ? 'company_id' : 'name',
            value: searchValue,
        });

        return {
            found: company !== undefined,
            company: company ?? {},
            user: company ?? {},
        };
    },
});
