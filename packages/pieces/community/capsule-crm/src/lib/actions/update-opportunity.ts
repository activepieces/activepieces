import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const updateOpportunity = createAction({
    name: 'update_opportunity',
    displayName: 'Update Opportunity',
    description: 'Update an existing sales opportunity',
    auth: capsuleAuth,
    props: {
        opportunityId: Property.ShortText({
            displayName: 'Opportunity ID',
            description: 'ID of the opportunity to update',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            description: 'Updated name of the opportunity',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Updated description of the opportunity',
            required: false,
        }),
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'Updated ID of the associated party (person or organisation)',
            required: false,
        }),
        milestoneId: Property.ShortText({
            displayName: 'Milestone ID',
            description: 'Updated ID of the opportunity milestone/stage',
            required: false,
        }),
        value: Property.Number({
            displayName: 'Value',
            description: 'Updated monetary value of the opportunity',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: 'Updated currency code (e.g., USD, EUR, GBP)',
            required: false,
        }),
        expectedCloseDate: Property.DateTime({
            displayName: 'Expected Close Date',
            description: 'Updated expected date when the opportunity will close',
            required: false,
        }),
        probability: Property.Number({
            displayName: 'Probability',
            description: 'Updated probability of closing the deal (0-100)',
            required: false,
        }),
        durationBasis: Property.StaticDropdown({
            displayName: 'Duration Basis',
            description: 'Updated duration measurement basis',
            required: false,
            options: {
                options: [
                    { label: 'Days', value: 'DAY' },
                    { label: 'Weeks', value: 'WEEK' },
                    { label: 'Months', value: 'MONTH' },
                    { label: 'Years', value: 'YEAR' }
                ]
            }
        }),
        duration: Property.Number({
            displayName: 'Duration',
            description: 'Updated duration of the opportunity in the specified basis',
            required: false,
        })
    },
    async run(context) {
        const {
            opportunityId,
            name,
            description,
            partyId,
            milestoneId,
            value,
            currency,
            expectedCloseDate,
            probability,
            durationBasis,
            duration
        } = context.propsValue;

        const opportunity: Record<string, any> = {};

        if (name) opportunity['name'] = name;
        if (description !== undefined) opportunity['description'] = description;
        if (partyId) opportunity['party'] = { id: parseInt(partyId) };
        if (milestoneId) opportunity['milestone'] = { id: parseInt(milestoneId) };
        if (value !== undefined) opportunity['value'] = { amount: value, currency: currency || 'USD' };
        if (expectedCloseDate) opportunity['expectedCloseDate'] = expectedCloseDate;
        if (probability !== undefined) opportunity['probability'] = probability;
        if (durationBasis && duration !== undefined) {
            opportunity['duration'] = {
                basis: durationBasis,
                value: duration
            };
        }

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/opportunities/${opportunityId}`,
            body: { opportunity }
        });

        return response.body;
    },
});
