import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { projectPageOutputSchema } from '../../output-schemas';
export const listProjectsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_projects',
	classification: 'SEARCH',
	displayName: 'List Projects',
	description: 'Lists or searches the projects visible to the user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the projects visible to the connected user, optionally filtered by text in the project name or key and by project type, with each project ID, key, name and type. The starting point for resolving a project name to the key or ID that other actions need. Paginated with Start At. Read-only.',
		idempotent: true,
	},
	outputSchema: projectPageOutputSchema,
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Only return projects whose name or key contains this text (case-insensitive).',
			required: false,
		}),
		typeKey: Property.StaticDropdown({
			displayName: 'Project Type',
			required: false,
			options: {
				options: [
					{ label: 'Software', value: 'software' },
					{ label: 'Business', value: 'business' },
					{ label: 'Service Management', value: 'service_desk' },
					{ label: 'Product Discovery', value: 'product_discovery' },
				],
			},
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 100 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/project/search',
			query: {
				query: propsValue.query,
				typeKey: propsValue.typeKey,
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
				expand: 'description,lead',
			},
		});
		return jiraAiHelpers.toPage({
			items: response.values ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
			isLast: response.isLast,
		});
	},
});
