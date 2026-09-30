import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { listObjectsOutputSchema } from '../../output-schemas';

export const listObjects = createAction({
	auth: salesforceAuth,
	name: 'list_objects',
	classification: 'READ',
	displayName: 'List Objects',
	description: 'List the objects available in the org.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the standard and custom objects in the Salesforce org with their API name, label and what the current user may do with them (query, create, update, delete). Use it to discover the right object API name before calling other tools; for one object\'s fields and relationships use Describe Object. Narrow the list with Search or Custom Only, since orgs often have hundreds of objects. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listObjectsOutputSchema,
	props: {
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Only return objects whose API name or label contains this text (case-insensitive).',
			required: false,
		}),
		custom_only: Property.Checkbox({
			displayName: 'Custom Only',
			description: 'Only return custom objects.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const response = await callSalesforceApi<{ sobjects: SObjectSummary[] }>(
			HttpMethod.GET,
			context.auth,
			'/services/data/v56.0/sobjects',
			undefined
		);
		const search = (context.propsValue.search ?? '').trim().toLowerCase();
		const objects = response.body.sobjects
			.filter((object) => !context.propsValue.custom_only || object.custom)
			.filter((object) => search.length === 0 || object.name.toLowerCase().includes(search) || object.label.toLowerCase().includes(search))
			.map((object) => ({
				name: object.name,
				label: object.label,
				custom: object.custom,
				queryable: object.queryable,
				createable: object.createable,
				updateable: object.updateable,
				deletable: object.deletable,
				key_prefix: object.keyPrefix,
			}));
		return { objects, count: objects.length };
	},
});

type SObjectSummary = {
	name: string;
	label: string;
	custom: boolean;
	queryable: boolean;
	createable: boolean;
	updateable: boolean;
	deletable: boolean;
	keyPrefix: string | null;
};
