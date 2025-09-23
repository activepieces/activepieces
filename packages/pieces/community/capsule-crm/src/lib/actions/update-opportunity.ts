import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { opportunityDropdown, partyDropdown, milestoneDropdown } from '../common/properties';

export const updateOpportunity = createAction({
    name: 'update_opportunity',
    displayName: 'Update Opportunity',
    description: 'Update an existing sales opportunity',
    auth: capsuleAuth,
    props: {
        opportunityId: opportunityDropdown({
            refreshers: ['auth'],
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
        partyId: partyDropdown({
            refreshers: ['auth'],
            required: false,
        }),
        milestoneId: milestoneDropdown({
            refreshers: ['auth'],
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
        const props = context.propsValue as {
            opportunityId: string;
            name?: string;
            description?: string;
            partyId?: string;
            milestoneId?: string;
            value?: number;
            currency?: string;
            expectedCloseDate?: string;
            probability?: number;
            durationBasis?: string;
            duration?: number;
        };

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
        } = props;

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            opportunityId: z.string().min(1, 'Opportunity ID is required'),
            name: z.string().min(1, 'Opportunity name cannot be empty').optional(),
            description: z.string().optional(),
            partyId: z.string().optional(),
            milestoneId: z.string().optional(),
            value: z.number().min(0, 'Value must be greater than or equal to 0').optional(),
            currency: z.string().optional(),
            expectedCloseDate: z.string().optional(),
            probability: z.number().min(0, 'Probability must be between 0 and 100').max(100, 'Probability must be between 0 and 100').optional(),
            duration: z.number().min(1, 'Duration must be greater than 0').optional(),
        });

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
