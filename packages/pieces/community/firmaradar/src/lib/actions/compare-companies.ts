import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { parseOrgnrs, stringList } from '../common/parse';
import { orgnrsProp } from '../common/props';

export const compareCompanies = createAction({
    name: 'compare_companies',
    auth: firmaradarAuth,
    displayName: 'Compare Companies',
    description:
        'Side-by-side financial comparison of up to 5 companies with aligned ' +
        'metric/year matrices — benchmark suppliers or acquisition targets.',
    props: {
        orgnrs: orgnrsProp(5, '1-5 nine-digit organisation numbers to compare.'),
        years: Property.Number({
            displayName: 'Years Back',
            description: 'Number of financial years to align (1-10).',
            required: false,
            defaultValue: 5,
        }),
        metrics: Property.StaticMultiSelectDropdown({
            displayName: 'Metrics',
            description: 'Metrics to include. Leave empty for the default set.',
            required: false,
            options: {
                options: [
                    { label: 'Revenue (omsetning)', value: 'omsetning' },
                    { label: 'Operating result (driftsresultat)', value: 'driftsresultat' },
                    { label: 'Net result (aarsresultat)', value: 'aarsresultat' },
                    { label: 'Total equity (sum_egenkapital)', value: 'sum_egenkapital' },
                    { label: 'Total debt (sum_gjeld)', value: 'sum_gjeld' },
                    { label: 'Employees (antall_ansatte)', value: 'antall_ansatte' },
                ],
            },
        }),
    },
    async run(context) {
        const metrics = stringList(context.propsValue.metrics);
        const body: Record<string, unknown> = {
            orgnrs: parseOrgnrs(context.propsValue.orgnrs),
        };
        if (context.propsValue.years) {
            body.years = context.propsValue.years;
        }
        if (metrics.length > 0) {
            body.metrics = metrics;
        }
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/companies/compare',
            body,
        });
    },
});
