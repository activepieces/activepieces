import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetLabelOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateLabelAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_label',
	outputSchema: mailjetLabelOutputSchema,
	displayName: 'Create Label',
	description: 'Creates a label.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a label for tagging templates (resource) or images (image). Names must be unique.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Label name, unique in the account.',
			required: true,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, e.g. "#FF5733".',
			required: true,
		}),
		usedFor: Property.StaticDropdown({
			displayName: 'Used For',
			description: 'resource for template labels (default), image for image labels.',
			required: false,
			options: {
				options: [
					{ label: 'resource', value: 'resource' },
					{ label: 'image', value: 'image' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v1/REST/labels',
			body: { Name: p.name, Color: p.color, UsedFor: p.usedFor },
		});
	},
});
