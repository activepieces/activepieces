import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const createOpportunity = createAction({
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Create a new sales opportunity',
    auth: capsuleAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            description: 'Name of the opportunity',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Detailed description of the opportunity',
            required: false,
        }),
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'ID of the associated party (person or organisation)',
            required: true,
        }),
        milestoneId: Property.ShortText({
            displayName: 'Milestone ID',
            description: 'ID of the opportunity milestone/stage',
            required: true,
        }),
        value: Property.Number({
            displayName: 'Value',
            description: 'Monetary value of the opportunity',
            required: false,
        }),
        currency: Property.ShortText({
            displayName: 'Currency',
            description: 'Currency code (e.g., USD, EUR, GBP)',
            required: false,
        }),
        expectedCloseDate: Property.DateTime({
            displayName: 'Expected Close Date',
            description: 'Expected date when the opportunity will close',
            required: false,
        }),
        probability: Property.Number({
            displayName: 'Probability',
            description: 'Probability of closing the deal (0-100)',
            required: false,
        }),
        durationBasis: Property.StaticDropdown({
            displayName: 'Duration Basis',
            description: 'How the opportunity duration is measured',
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
            description: 'Duration of the opportunity in the specified basis',
            required: false,
        })
    },
    async run(context) {
        const {
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

        const opportunity: Record<string, any> = {
            name,
            party: {
                id: parseInt(partyId)
            },
            milestone: {
                id: parseInt(milestoneId)
            }
        };

        if (description) opportunity['description'] = description;
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
            method: HttpMethod.POST,
            resourceUri: '/opportunities',
            body: { opportunity }
        });

        return response.body;
    },
});
