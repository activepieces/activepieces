import {
	createTrigger,
	TriggerStrategy,
	Property,
} from '@activepieces/pieces-framework';
import { documentProAuth } from '../common/auth';

export const newDocument = createTrigger({
	auth: documentProAuth,
	name: 'new_document',
	displayName: 'New Document',
	description: 'Triggers when a document processing status changes (e.g., when a document is uploaded and processed).',
	props: {
		webhookInfo: Property.MarkDown({
			value: `
**To set up this webhook:**

1. Navigate to your desired Workflow in DocumentPro
2. Go to the "Workflow" tab
3. In the export section, find the "Webhook" option
4. Set your Webhook Endpoint URL to:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
5. Click Save

The webhook will trigger when document processing status changes (completed, failed, etc.).
			`,
		}),
	},
	sampleData: {
		event: 'file_request_status_change',
		timestamp: '2024-07-25T14:30:29.565249',
		data: {
			request_id: 'a7813466-6f9a-4c33-8128-427e7a4df755',
			request_status: 'completed',
			response_body: {
				file_name: 'Q2_Financial_Report_2024.pdf',
				file_presigned_url:
					'https://documentpro-parsed-files.s3.amazonaws.com/Q2_Financial_Report_2024_parsed.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256',
				user_error_msg: null,
				template_id: '8e9beda9-5cba-42eb-a70a-b3e5eec9120a',
				template_type: 'financial_report',
				template_title: 'Quarterly Financial Report Parser',
				num_pages: 15,
				human_verification_status: 'approved',
				has_missing_required_fields: false,
				result_json_data: {
					company_name: 'TechCorp Innovations Inc.',
					report_period: 'Q2 2024',
					financial_highlights: {
						total_revenue: 1250000,
						net_income: 450000,
					},
				},
			},
			created_at: '2024-07-25T14:30:10.696893',
			updated_at: '2024-07-25T14:30:29.565249',
		},
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable() {
		// Webhook URL is automatically provided by Activepieces
		// User needs to manually configure the webhook URL in DocumentPro dashboard
	},
	async onDisable() {
		// User should remove webhook from DocumentPro dashboard manually
	},
	async run(context) {
		return [context.payload.body];
	},
});

