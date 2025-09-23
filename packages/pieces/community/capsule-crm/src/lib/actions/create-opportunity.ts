import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { partyDropdown, milestoneDropdown } from '../common/properties';

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
        partyId: partyDropdown({
            refreshers: ['auth'],
            required: true,
        }),
        milestoneId: milestoneDropdown({
            refreshers: ['auth'],
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
        const props = context.propsValue as {
            name: string;
            description?: string;
            partyId: string;
            milestoneId: string;
            value?: number;
            currency?: string;
            expectedCloseDate?: string;
            probability?: number;
            durationBasis?: string;
            duration?: number;
        };

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
        } = props;

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            name: z.string().min(1, 'Opportunity name cannot be empty'),
            partyId: z.string().min(1, 'Party ID is required'),
            milestoneId: z.string().min(1, 'Milestone ID is required'),
            value: z.number().min(0, 'Value must be greater than or equal to 0').optional(),
            currency: z.string().optional(),
            probability: z.number().min(0, 'Probability must be between 0 and 100').max(100, 'Probability must be between 0 and 100').optional(),
            duration: z.number().min(1, 'Duration must be greater than 0').optional(),
        });

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
