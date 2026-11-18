import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformCreateFormOutputSchema } from '../../../output-schemas';

const VISIBILITY_OPTIONS = [
	{ label: 'Public', value: 'public' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Closed', value: 'closed' },
];

const DISPLAY_DEFAULTS = {
	theme: 'default',
	presentation_style: 'classic',
	width: 'centered',
	size: 'md',
	border_radius: 'small',
	dark_mode: 'light',
	color: '#3B82F6',
	uppercase_labels: false,
	no_branding: false,
	transparent_background: false,
};

export const opnformCreateFormAction = createAction({
	auth: opnformAuth,
	name: 'opnform_create_form',
	outputSchema: opnformCreateFormOutputSchema,
	displayName: 'Create Form',
	description: 'Creates a new form in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new form in a workspace with the given fields, and returns the full form with its id and slug. Not idempotent: each call creates another form.',
		idempotent: false,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Form title, up to 60 characters.',
			required: true,
		}),
		visibility: Property.StaticDropdown({
			displayName: 'Visibility',
			description: 'public (accepts submissions), draft or closed.',
			required: true,
			options: {
				disabled: false,
				options: VISIBILITY_OPTIONS,
			},
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Two-letter ISO language code, e.g. "en".',
			required: true,
		}),
		properties: Property.Json({
			displayName: 'Fields',
			description:
				'JSON array of form fields. Each needs a unique `id`, a `type` (e.g. "text", "email", "number", "select", "checkbox", "date") and a `name`; optional `required`, `placeholder`, `help`. Example: [{"id": "f1", "type": "text", "name": "Full name", "required": true}].',
			required: true,
		}),
		additionalFields: Property.Json({
			displayName: 'Additional Settings',
			description:
				'Optional JSON object of other form settings, e.g. {"submitted_text": "Thanks!", "tags": ["leads"], "closes_at": "2026-12-31T23:59:59Z"}. Also overrides the display defaults: theme "default", presentation_style "classic", width "centered", size "md", border_radius "small", dark_mode "light", color "#3B82F6", uppercase_labels, no_branding and transparent_background false. The fields above take precedence.',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, title, visibility, language, properties, additionalFields } =
			context.propsValue;
		return await opnformApi.createForm({
			auth: context.auth,
			body: {
				...DISPLAY_DEFAULTS,
				...additionalFields,
				workspace_id: Number(workspaceId),
				title,
				visibility,
				language,
				properties,
			},
		});
	},
});
