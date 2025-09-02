import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { PredictLeadsAuth } from '../..';
import { PredictLeadsClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof PredictLeadsAuth>) {
	const client = new PredictLeadsClient(auth.apiKey, auth.apiToken);
	return client;
}

export const CommonFields = {
	page: Property.Number({
		displayName: 'Page',
		description: 'Page number of shown items',
		required: false,
	}),
	limit: Property.Number({
		displayName: 'Limit',
		description: 'Limit the number of shown items per page. Max 1000.',
		required: false,
	}),
} as const;


export const pageField = Property.Number({
	displayName: 'Page',
	description: 'Page number of shown items',
	required: false,
})

export const limitField = Property.Number({
	displayName: 'Limit',
	description: 'Limit the number of shown items per page. Max 1000.',
	required: false,
})

export const firstSeenAtFromField = Property.ShortText({
	displayName: 'First Seen At From',
	description: 'Only return data first seen after given date . Example 2024-09-25',
	required: false,
})

export const firstSeenAtUntilField = Property.ShortText({
	displayName: 'First Seen At Until',
	description: 'Only return data first seen before given date . Example 2024-09-25',
	required: false,
})

export const lastSeenAtFromField = Property.ShortText({
	displayName: 'Last Seen At From',
	description: "Only return data last seen after given date . Example 2024-09-25",
	required: false,
})

export const lastSeenAtUntilField = Property.ShortText({
	displayName: 'Last Seen At Until',
	description: "Only return data last seen before given date . Example 2024-09-25",
	required: false,
})