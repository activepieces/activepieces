import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticUpdateReportOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateReportAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_report',
	outputSchema: mauticUpdateReportOutputSchema,
	displayName: 'Update Report',
	description: 'Updates fields of a Mautic report.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing report. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Report Id',
			description: 'Numeric report id, from List Reports or Create Report.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		source: Property.ShortText({
			displayName: 'Source',
			description:
				'Data source, e.g. "leads", "companies", "email.stats", "page.hits", "form.submissions", "asset.downloads", "campaign_lead_event_log".',
			required: false,
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
		const {
			id,
			additionalFields,
			name,
			source,
			columns,
			filters,
			description,
			isPublished,
			system,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'reports',
			id,
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
