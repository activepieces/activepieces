import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetImageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateImageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_image',
	outputSchema: mailjetImageOutputSchema,
	displayName: 'Update Image',
	description: 'Updates the metadata of a gallery image.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name, status, labels or starred flag of an image. Only the fields you set change. To change the file use Replace Image.',
		idempotent: true,
	},
	props: {
		imageId: mailjetAiProps.id({
			displayName: 'Image ID',
			description: 'Image ID, from List Images or Upload Image.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New image name.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'open allows edits, locked prevents them.',
			required: false,
			options: {
				options: [
					{ label: 'open', value: 'open' },
					{ label: 'locked', value: 'locked' },
				],
			},
		}),
		labelIds: Property.Array({
			displayName: 'Label IDs',
			description: 'Numeric label IDs, from List Labels.',
			required: false,
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes stars the image, No unstars it.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v1/REST/images/${encodeURIComponent(p.imageId)}`,
			body: { Name: p.name, Status: p.status, LabelIDs: p.labelIds, IsStarred: p.isStarred },
		});
	},
});
