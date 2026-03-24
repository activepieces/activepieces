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
	displayName: 'Get Issue',
	description: 'Get issue data.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		expand: Property.StaticMultiSelectDropdown({
			displayName: 'Expand',
			description: 'Include additional information about the issue in the response',
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
			description: `
Map human readable names to Fields, Rendered Fields, Schema and Edit Meta.
Notes:
- This would implicitly add "names" to the expand field
- If there are fields with the same name, they may be overridden
			`.trim(),
			required: true,
			defaultValue: false,
		}),
		mapTransitions: Property.Checkbox({
			displayName: 'Map Transition Names',
			description: `
Map human readable names to Transitions.
Notes:
- If there are transitions with the same name, they may be overridden
- This changes the original data structure from list to map
			`.trim(),
			required: true,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { issueId, expand, mapNames, mapTransitions } = context.propsValue;

		const queryParams = {} as QueryParams;
		let expandParams = expand as string[];

		// implicitly expand names which is needed for mapping
		if (mapNames) {
			expandParams = [...new Set(expandParams).add('names')];
		}

		if (expandParams) {
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
