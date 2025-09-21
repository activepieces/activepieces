import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { opportunityDropdown, milestoneDropdown } from '../common/props';

export const updateOpportunity = createAction({
    auth: capsuleCrmAuth,
    name: 'update_opportunity',
    displayName: 'Update Opportunity',
    description: 'Update existing Opportunity fields.',
    props: {
        opportunityId: opportunityDropdown,
        name: Property.ShortText({
            displayName: 'Name',
            description: 'A short name for the opportunity. Leave blank to keep the current value.',
            required: false,
        }),
        milestoneId: milestoneDropdown,
        description: Property.LongText({
            displayName: 'Description',
            description: 'A more detailed description. Leave blank to keep the current value.',
            required: false,
        }),
        value_amount: Property.Number({
            displayName: 'Value',
            description: 'The monetary value of the opportunity. Leave blank to keep the current value.',
            required: false,
        }),
        value_currency: Property.ShortText({
            displayName: 'Currency',
            description: 'The 3-letter currency code (e.g., USD, GBP). Leave blank to keep the current value.',
            required: false,
        }),
        expectedCloseOn: Property.ShortText({
            displayName: 'Expected Close Date',
            description: 'The expected close date (YYYY-MM-DD). Leave blank to keep the current value.',
            required: false,
        }),
        probability: Property.Number({
            displayName: 'Probability (%)',
            description: 'The chance of winning (0-100). Leave blank to keep the current value.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            opportunityId,
            name,
            milestoneId,
            description,
            value_amount,
            value_currency,
            expectedCloseOn,
            probability
        } = propsValue;

        const opportunityPayload: { [key: string]: any } = {};

        if (name) opportunityPayload['name'] = name;
        if (milestoneId) opportunityPayload['milestone'] = { id: milestoneId };
        if (description) opportunityPayload['description'] = description;
        if (expectedCloseOn) opportunityPayload['expectedCloseOn'] = expectedCloseOn;
        if (probability !== undefined) opportunityPayload['probability'] = probability;

        if (value_amount && value_currency) {
            opportunityPayload['value'] = {
                amount: value_amount,
                currency: value_currency
            };
        } else if (value_amount || value_currency) {
            throw new Error("Both Value and Currency must be provided to update the opportunity's value.");
        }

        if (Object.keys(opportunityPayload).length === 0) {
            return { success: true, message: "No fields provided to update." };
        }

        const response = await makeRequest(
            auth,
            HttpMethod.PUT,
            `/opportunities/${opportunityId}`,
            { opportunity: opportunityPayload }
        );

        return response;
    },
});