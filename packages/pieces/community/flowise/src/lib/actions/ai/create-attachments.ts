import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseCreateAttachmentsOutputSchema } from '../../output-schemas';

export const createAttachmentsAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_attachments',
	outputSchema: flowiseCreateAttachmentsOutputSchema,
	displayName: 'Create Attachment',
	description: 'Uploads a file to a chat and returns its extracted content.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file to one chat of a chatflow and returns its extracted text content, ready to pass to Make Prediction. The chatflow must have file uploads enabled.',
		idempotent: false,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({ required: true }),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload.',
			required: true,
		}),
		base64: flowiseAiProps.yesNo({
			required: false,
			displayName: 'Return Base64',
			description: 'Return the file content as base64 instead of extracted text.',
		}),
	},
	async run(context) {
		const { chatflowId, chatId, file, base64 } = context.propsValue;
		return await flowiseApi.createAttachments({
			auth: context.auth,
			chatflowId,
			chatId,
			file: { filename: file.filename, data: file.data },
			base64,
		});
	},
});
