import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { confluenceAuth } from '../auth';
import { confluenceRawRequest } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const uploadAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'upload-attachment',
	displayName: 'Upload Attachment',
	description: 'Uploads a file as an attachment to a page.',
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
		comment: Property.ShortText({
			displayName: 'Version Comment',
			description: 'Optional comment associated with this attachment version.',
			required: false,
		}),
		minorEdit: Property.Checkbox({
			displayName: 'Minor Edit',
			description: 'If enabled, no notifications are sent to page watchers.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { pageId, file, comment, minorEdit } = context.propsValue;

		const formData = new FormData();
		const buffer = Buffer.from(file.base64, 'base64');
		formData.append('file', buffer, file.filename);
		if (comment) formData.append('comment', comment);
		formData.append('minorEdit', String(minorEdit ?? true));

		return await confluenceRawRequest({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.POST,
			url: `/wiki/rest/api/content/${pageId}/child/attachment`,
			headers: {
				'X-Atlassian-Token': 'no-check',
				...formData.getHeaders(),
			},
			body: formData,
		});
	},
});
