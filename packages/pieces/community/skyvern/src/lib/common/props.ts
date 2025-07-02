import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { skyvernApiCall } from './client';

export interface ListWorkflowResponse {
	workflow_permanent_id: string;
	title: string;
	workflow_definition: {
		parameters: {
			parameter_type: string;
			key: string;
			workflow_parameter_type: string;
			default_value: any;
		}[];
	};
}

export const workflowId = Property.Dropdown({
	displayName: 'Workflow',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		let hasMore = true;
		let page = 1;
		const workflows = [];

		do {
			const response = await skyvernApiCall<ListWorkflowResponse[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/workflows',
				query: {
					page_size: 100,
					page,
				},
			});

			if (isNil(response) || !Array.isArray(response)) break;
			workflows.push(...response);

			hasMore = response.length > 0;
			page++;
		} while (hasMore);

		return {
			disabled: false,
			options: workflows.map((workflow) => ({
				label: workflow.title,
				value: workflow.workflow_permanent_id,
			})),
		};
	},
});

export const workflowParams = Property.DynamicProperties({
	displayName: 'Workflow Params',
	refreshers: ['workflowId'],
	required: false,
	props: async ({ auth, workflowId }) => {
		if (!auth || !workflowId) return {};

		let hasMore = true;
		let page = 1;
		let matchedWorkflow: ListWorkflowResponse | undefined = undefined;

		do {
			const response = await skyvernApiCall<ListWorkflowResponse[]>({
				apiKey: auth as unknown as string,
				method: HttpMethod.GET,
				resourceUri: '/workflows',
				query: {
					page_size: 100,
					page,
				},
			});

			if (isNil(response) || !Array.isArray(response)) break;

			matchedWorkflow = response.find(
				(workflow) => workflow.workflow_permanent_id === (workflowId as unknown as string),
			);

			if (matchedWorkflow) break;

			hasMore = response.length > 0;
			page++;
		} while (hasMore);

		if (isNil(matchedWorkflow)) return {};

		const fields: DynamicPropsValue = {};

		for (const field of matchedWorkflow.workflow_definition.parameters) {
			if (field.parameter_type !== 'workflow') continue;

			const { key, workflow_parameter_type, default_value: defaultValue } = field;
			const required = isNil(defaultValue);
			const displayName = key;

			if (workflow_parameter_type === 'credential_id') {
				const response = await skyvernApiCall<{ credential_id: string; name: string }[]>({
					apiKey: auth as unknown as string,
					method: HttpMethod.GET,
					resourceUri: '/credentials',
					query: {
						page_size: 100,
					},
				});
				const credentials = response || [];
				fields[field.key] = Property.StaticDropdown({
					displayName,
					required,
					defaultValue,
					options: {
						disabled: false,
						options: credentials.map((cred) => ({
							label: cred.name,
							value: cred.credential_id,
						})),
					},
				});

				continue;
			}

			switch (workflow_parameter_type) {
				case 'string':
				case 'file_url':
					fields[field.key] = Property.ShortText({
						displayName,
						required,
						defaultValue,
					});
					break;
				case 'float':
				case 'integer':
					fields[field.key] = Property.Number({
						displayName,
						required,
						defaultValue,
					});
					break;
				case 'boolean':
					fields[field.key] = Property.Checkbox({
						displayName,
						required,
						defaultValue,
					});
					break;
				case 'json':
					fields[field.key] = Property.Json({
						displayName,
						required,
						defaultValue,
					});
					break;
				default:
					break;
			}
		}
		return fields;
	},
});
