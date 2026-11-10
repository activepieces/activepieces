import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDownloadAttachmentsArchiveOutputSchema } from '../../output-schemas';

export const gristDownloadAttachmentAction = createAction({
  auth: gristAuth,
  name: 'grist_download_attachment',
  outputSchema: gristDownloadAttachmentsArchiveOutputSchema,
  displayName: 'Download Attachment',
  description: 'Downloads one attachment as a file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Downloads the contents of one attachment by ID and returns a file reference plus its name. Get the ID from **List Attachments** or a record's Attachments cell.",
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    attachmentId: Property.Number({
      displayName: 'Attachment ID',
      required: true,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, attachmentId } = context.propsValue;
    const metadata = await client.makeRequest<{ fileName?: string }>(
      HttpMethod.GET,
      `/docs/${documentId}/attachments/${attachmentId}`,
      undefined,
      undefined
    );
    const content = await client.download(
      `/docs/${documentId}/attachments/${attachmentId}/download`
    );
    const fileName = metadata.fileName ?? `attachment-${attachmentId}`;
    const file = await context.files.write({ fileName, data: content });
    return { file, file_name: fileName, size: content.length };
  },
});
