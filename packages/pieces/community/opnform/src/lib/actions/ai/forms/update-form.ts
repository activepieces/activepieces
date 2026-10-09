import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformUpdateFormOutputSchema } from '../../../output-schemas';

const VISIBILITY_OPTIONS = [
	{ label: 'Public', value: 'public' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Closed', value: 'closed' },
];

const RETENTION_UNIT_OPTIONS = [
	{ label: 'Days', value: 'day' },
	{ label: 'Weeks', value: 'week' },
	{ label: 'Months', value: 'month' },
	{ label: 'Years', value: 'year' },
];

export const opnformUpdateFormAction = createAction({
	auth: opnformAuth,
	name: 'opnform_update_form',
	outputSchema: opnformUpdateFormOutputSchema,
	displayName: 'Update Form',
	description: 'Updates a form, keeping every setting you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a form. Reads the current form first and changes only the fields you set, since the API needs the full form on every update. Fields replaces all of the form's fields, so pass the complete list from Get Form with your edits. Not safe against a concurrent edit of the same form.",
		idempotent: true,
	},
	props: {
		formSlug: opnformAiProps.formSlug({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New form title, up to 60 characters.',
			required: false,
		}),
		visibility: Property.StaticDropdown({
			displayName: 'Visibility',
			description: 'public (accepts submissions), draft or closed.',
			required: false,
			options: {
				disabled: false,
				options: VISIBILITY_OPTIONS,
			},
		}),
		properties: Property.Json({
			displayName: 'Fields',
			description:
				'Optional JSON array that replaces ALL form fields. Start from the `properties` returned by Get Form and keep each field `id`, or existing answers lose their field.',
			required: false,
		}),
		submissionRetentionValue: Property.Number({
			displayName: 'Submission Retention',
			description:
				'Automatically delete submissions older than this many units (set together with Retention Unit). Deleted submissions cannot be restored.',
			required: false,
		}),
		submissionRetentionUnit: Property.StaticDropdown({
			displayName: 'Retention Unit',
			description: 'Unit for Submission Retention.',
			required: false,
			options: {
				disabled: false,
				options: RETENTION_UNIT_OPTIONS,
			},
		}),
		additionalFields: Property.Json({
			displayName: 'Additional Settings',
			description:
				'Optional JSON object of other form settings to change, e.g. {"submitted_text": "Thanks!", "closes_at": "2026-12-31T23:59:59Z"}. The fields above take precedence.',
			required: false,
		}),
	},
	async run(context) {
		const {
			formSlug,
			title,
			visibility,
			properties,
			submissionRetentionValue,
			submissionRetentionUnit,
			additionalFields,
		} = context.propsValue;
		const current = await opnformApi.getForm({ auth: context.auth, formSlug });
		return await opnformApi.updateForm({
			auth: context.auth,
			formId: String(current.id),
			body: {
				...current,
				...additionalFields,
				...(title !== undefined ? { title } : {}),
				...(visibility !== undefined ? { visibility } : {}),
				...(properties !== undefined ? { properties } : {}),
				...(submissionRetentionValue !== undefined
					? { submission_retention_value: submissionRetentionValue }
					: {}),
				...(submissionRetentionUnit !== undefined
					? { submission_retention_unit: submissionRetentionUnit }
					: {}),
			},
		});
	},
});
