import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const createImageAction = createAction({
	name: 'create-image',
	auth: placidAuth,
	displayName: 'Create Image',
	description: 'Generate a dynamic image from a specified template using input data.',
	props: {
		template_uuid: Property.ShortText({
			displayName: 'Template UUID',
			required: true,
		}),
		webhook_success: Property.ShortText({
			displayName: 'Webhook Success URL',
			required: false,
			description: 'Webhook URL to send status after image creation.',
		}),
		create_now: Property.Checkbox({
			displayName: 'Create Now',
			description: 'Process the image instantly instead of queueing it.',
			required: false,
			defaultValue: false,
		}),
		passthrough: Property.ShortText({
			displayName: 'Passthrough',
			description: 'Extra data to attach and receive in webhooks.',
			required: false,
		}),
		layers: Property.Json({
			displayName: 'Layers',
			description: 'Image layer modifications like text, images, visibility, etc.',
			required: true,
		}),
		modifications: Property.Json({
			displayName: 'Modifications',
			required: false,
			description: 'Object for width, height, filename, image_format, etc.',
		}),
		transfer: Property.Json({
			displayName: 'Transfer',
			required: false,
			description: 'Transfer settings (e.g., to S3 bucket).',
		}),
	},
	async run({ propsValue, auth }) {
		const {
			template_uuid,
			webhook_success,
			create_now,
			passthrough,
			layers,
			modifications,
			transfer,
		} = propsValue;

		const body = {
			template_uuid,
			webhook_success,
			create_now,
			passthrough,
			layers,
			modifications,
			transfer,
		};

		const response = await placidApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: '/images',
			body,
		});

		return response;
	},
});
