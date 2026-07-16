import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const convertNok = createAction({
    name: 'convert_nok',
    auth: firmaradarAuth,
    displayName: 'Convert NOK Amount',
    description:
        'Convert a NOK amount to EUR, USD, GBP, SEK or DKK using daily Norges ' +
        'Bank rates — show Norwegian financials in the recipient\'s currency. ' +
        'Omit the amount for rate metadata only.',
    props: {
        to: Property.StaticDropdown({
            displayName: 'Target Currency',
            required: true,
            options: {
                options: [
                    { label: 'EUR', value: 'EUR' },
                    { label: 'USD', value: 'USD' },
                    { label: 'GBP', value: 'GBP' },
                    { label: 'SEK', value: 'SEK' },
                    { label: 'DKK', value: 'DKK' },
                ],
            },
        }),
        amount: Property.Number({
            displayName: 'Amount (NOK)',
            description: 'NOK amount to convert. Leave empty for rate metadata only.',
            required: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/currency/convert',
            query: {
                to: context.propsValue.to,
                amount: context.propsValue.amount,
            },
        });
    },
});
