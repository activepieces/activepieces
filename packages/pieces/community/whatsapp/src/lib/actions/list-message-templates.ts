import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappClient } from '../common/client';
import { listMessageTemplatesOutputSchema } from '../output-schemas';

export const listMessageTemplates = createAction({
	auth: whatsappAuth,
	name: 'list_message_templates',
	outputSchema: listMessageTemplatesOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Message Templates',
	description: 'Lists the message templates on the business account, optionally filtered by status.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the message templates registered on the WhatsApp Business Account with their id, name, language, category, status and components. Use it to find a template id or check approval state before Send Template Message. Filter by status (APPROVED, PENDING, REJECTED, PAUSED, DISABLED) to narrow the result. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return templates in this review state. Leave empty for all.',
			required: false,
			options: {
				options: [
					{ label: 'Approved', value: 'APPROVED' },
					{ label: 'Pending', value: 'PENDING' },
					{ label: 'Rejected', value: 'REJECTED' },
					{ label: 'Paused', value: 'PAUSED' },
					{ label: 'Disabled', value: 'DISABLED' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of templates to return. Defaults to 100.',
			required: false,
		}),
	},
	async run(context) {
		const { status, limit } = context.propsValue;
		const queryParams: QueryParams = {
			fields: 'id,name,language,category,status,components,quality_score',
			limit: String(limit ?? 100),
		};
		if (status) queryParams['status'] = status;
		const response = await whatsappClient.request<{ data: TemplateRecord[] }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.GET,
			path: `/${context.auth.props.businessAccountId}/message_templates`,
			queryParams,
		});
		return {
			templates: response.data,
			count: response.data.length,
		};
	},
});

type TemplateRecord = {
	id: string;
	name: string;
	language: string;
	category: string;
	status: string;
	components: unknown[];
	quality_score?: { score: string };
};
