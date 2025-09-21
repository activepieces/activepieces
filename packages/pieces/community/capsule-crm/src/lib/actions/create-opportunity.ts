import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyDropdown, milestoneDropdown } from '../common/props';

export const createOpportunity = createAction({
    auth: capsuleCrmAuth,
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Create a new Opportunity.',
    props: {
        partyId: partyDropdown,
        name: Property.ShortText({
            displayName: 'Name',
            description: 'A short name for the opportunity (e.g., "Website Redesign").',
            required: true,
        }),
        milestoneId: milestoneDropdown,
        description: Property.LongText({
            displayName: 'Description',
            description: 'A more detailed description of the opportunity.',
            required: false,
        }),
        value_amount: Property.Number({
            displayName: 'Value',
            description: 'The monetary value of the opportunity.',
            required: false,
        }),
        value_currency: Property.ShortText({
            displayName: 'Currency',
            description: 'The 3-letter currency code (e.g., USD, GBP, EUR).',
            required: false,
        }),
        expectedCloseOn: Property.ShortText({
            displayName: 'Expected Close Date',
            description: 'The date you expect to close this opportunity (YYYY-MM-DD).',
            required: false,
        }),
        probability: Property.Number({
            displayName: 'Probability (%)',
            description: 'The chance of winning this opportunity (0-100).',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            partyId,
            name,
            milestoneId,
            description,
            value_amount,
            value_currency,
            expectedCloseOn,
            probability
        } = propsValue;

        const opportunityPayload: { [key: string]: any } = {
            party: { id: partyId },
            name: name,
            milestone: { id: milestoneId },
            description: description,
            expectedCloseOn: expectedCloseOn,
            probability: probability
        };

        if (value_amount && value_currency) {
            opportunityPayload['value'] = {
                amount: value_amount,
                currency: value_currency
            };
        }

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/opportunities',
            { opportunity: opportunityPayload }
        );

        return response;
    },
});