import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetLabelOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateLabelAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_label',
	outputSchema: mailjetLabelOutputSchema,
	displayName: 'Update Label',
	description: 'Renames or recolors a label.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates the name and/or color of a label. Only the fields you set change.',
		idempotent: true,
	},
	props: {
		labelId: mailjetAiProps.id({
			displayName: 'Label ID',
			description: 'Numeric label ID, from List Labels or Create Label.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New label name.',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'New hex color, e.g. "#FF5733".',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v1/REST/labels/${encodeURIComponent(p.labelId)}`,
			body: { Name: p.name, Color: p.color },
		});
	},
});
