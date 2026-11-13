import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateReportOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateReportAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_report',
	outputSchema: mauticCreateReportOutputSchema,
	displayName: 'Create Report',
	description: 'Creates a Mautic report.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a report. Name and Source are required, with the columns to show.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		source: Property.ShortText({
			displayName: 'Source',
			description:
				'Data source, e.g. "leads", "companies", "email.stats", "page.hits", "form.submissions", "asset.downloads", "campaign_lead_event_log".',
			required: true,
		}),
		columns: Property.Array({
			displayName: 'Columns',
			description:
				'Column keys to include, e.g. ["l.id", "l.email", "l.firstname"]. Get Report on an existing report shows valid keys.',
			required: false,
		}),
		filters: Property.Array({
			displayName: 'Filters',
			description:
				'Filters, each like {"column": "l.email", "condition": "like", "value": "%@example.com", "glue": "and"}.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		system: mauticAiProps.yesNo({
			displayName: 'Visible to Everyone',
			description: 'Whether all users can see the report.',
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other report properties, e.g. "tableOrder", "graphs", "groupBy", "aggregators", "isScheduled", "scheduleUnit", "toAddress". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, name, source, columns, filters, description, isPublished, system } =
			context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'reports',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('source', source),
				...spreadIfDefined('columns', columns),
				...spreadIfDefined('filters', filters),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('system', system),
			},
		});
	},
});
