import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall, confluenceRawRequest } from '../common';

type AttachmentResponse = {
	id: string;
	title: string;
	mediaType: string;
	fileSize: number;
	downloadLink: string;
};

export const downloadAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'download-attachment',
	displayName: 'Download Attachment',
	description: 'Downloads an attachment file by its ID and returns it as a file.',
	audience: 'both',
	aiMetadata: { description: 'Downloads a Confluence attachment by its attachment ID, resolving the download link from the attachment metadata and returning the binary as a file plus the attachment details. Use to retrieve the actual file contents of an attachment (use List Attachments first to discover IDs). Read-only and idempotent.', idempotent: true },
	props: {
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'ID of the attachment to download. Use "List Attachments" to look up IDs.',
			required: true,
		}),
	},
	async run(context) {
		const { attachmentId } = context.propsValue;

		const attachment = await confluenceApiCall<AttachmentResponse>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/attachments/${attachmentId}`,
		});

		const buffer = await confluenceRawRequest<Buffer>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			url: `/wiki${attachment.downloadLink}`,
			responseType: 'arraybuffer',
			followRedirects: true,
		});

		const file = await context.files.write({
			fileName: attachment.title,
			data: Buffer.from(buffer),
		});

		return {
			file,
			attachment,
		};
	},
});
