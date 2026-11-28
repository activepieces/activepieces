import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

function mapFieldNames(
	fields: Record<string, unknown>,
	fieldNames: Record<string, string>,
) {
	const mappedFields = {} as Record<string, unknown>;

	for (const [fieldId, fieldValue] of Object.entries(fields)) {
		const fieldName = fieldNames?.[fieldId];
		if (fieldName) {
			mappedFields[fieldName] = fieldValue;
		} else {
			// fallback in case field cannot be mapped (but this should not happen)
			mappedFields[fieldId] = fieldValue;
		}
	}

	return mappedFields;
}

export const getIssueAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'get_issue',
	classification: 'READ',
	displayName: 'Get Issue',
	description: "Gets an issue's fields and details.",
	audience: 'both',
	aiMetadata: {
		description:
			'Retrieves the full data for a single Jira Data Center/Server issue by ID or key. Use to read an issue\'s fields, status, comments, or changelog; optional expand selections (rendered fields, names, schema, transitions, edit-meta, changelog) and human-readable field/transition name mapping can enrich the result. Read-only and idempotent.',
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'issue',
			display: 'section',
			label: 'Issue',
			icon: 'inbox',
			props: ['projectId', 'issueId'],
		},
		{
			key: 'output',
			display: 'section',
			label: 'Output',
			icon: 'sliders',
			props: ['expand', 'mapNames', 'mapTransitions'],
		},
	],
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		expand: Property.StaticMultiSelectDropdown({
			displayName: 'Extra Data',
			description: 'More sections to include in the output.',
			required: false,
			options: {
				options: [
					{
						label: 'Rendered Fields',
						value: 'renderedFields',
					},
					{
						label: 'Names',
						value: 'names',
					},
					{
						label: 'Schema',
						value: 'schema',
					},
					{
						label: 'Transitions',
						value: 'transitions',
					},
					{
						label: 'Edit Meta',
						value: 'editmeta',
					},
					{
						label: 'Changelog',
						value: 'changelog',
					},
				],
			},
		}),
		mapNames: Property.Checkbox({
			displayName: 'Map Field Names',
			description: 'Key fields by their name instead of their ID.',
			required: false,
			defaultValue: false,
		}),
		mapTransitions: Property.Checkbox({
			displayName: 'Map Transition Names',
			description: "Adds the issue's transitions, keyed by name.",
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { issueId, expand, mapNames, mapTransitions } = context.propsValue;

		const queryParams: QueryParams = {};
		const expandParams = [
			...new Set([...(expand ?? []), ...(mapNames ? ['names'] : []), ...(mapTransitions ? ['transitions'] : [])]),
		];

		if (expandParams.length > 0) {
			queryParams['expand'] = expandParams.join(',');
		}

		const response = await sendJiraRequest({
			method: HttpMethod.GET,
			url: `issue/${issueId}`,
			auth: context.auth,
			queryParams: queryParams,
		});

		const data = response.body as Record<string, any>;

		if (mapNames) {
			const fieldNames = (data['names'] || {}) as Record<string, string>;

			const mappedFields = mapFieldNames(data['fields'] as Record<string, unknown>, fieldNames);
			data['fields'] = mappedFields;

			if (data['renderedFields']) {
				const mappedRenderedFields = mapFieldNames(data['renderedFields'] as Record<string, unknown>, fieldNames);
				data['renderedFields'] = mappedRenderedFields;
			}

			if (data['schema']) {
				const mappedSchemaFields = mapFieldNames(data['schema'] as Record<string, unknown>, fieldNames);
				data['schema'] = mappedSchemaFields;
			}

			if ((data['editmeta'] as any)?.fields) {
				const mappedEditmetaFields = mapFieldNames((data['editmeta'] as any).fields, fieldNames);
				data['editmeta'] = { ...(data['editmeta'] as any), fields: mappedEditmetaFields };
			}
		}

		if (mapTransitions && data['transitions']) {
			const mappedTransitions = (data['transitions'] as Array<{ name: string; [key: string]: unknown }>).reduce(
				(acc: Record<string, unknown>, transition) => {
					acc[transition.name] = transition;
					return acc;
				},
				{},
			);

			data['transitions'] = mappedTransitions;
		}

		return data;
	},
});
