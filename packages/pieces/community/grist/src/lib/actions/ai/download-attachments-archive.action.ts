import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDownloadAttachmentsArchiveOutputSchema } from '../../output-schemas';

export const gristDownloadAttachmentsArchiveAction = createAction({
  auth: gristAuth,
  name: 'grist_download_attachments_archive',
  outputSchema: gristDownloadAttachmentsArchiveOutputSchema,
  displayName: 'Download Attachments Archive',
  description: 'Downloads all attachments of a document as one archive.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads every attachment in a document as a single zip or tar file. Can be large; prefer **Download Attachment** when you need one file.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'zip',
      options: {
        options: [
          { label: 'Zip', value: 'zip' },
          { label: 'Tar', value: 'tar' },
        ],
      },
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, format } = context.propsValue;
    const extension = format ?? 'zip';
    const content = await client.download(
      `/docs/${documentId}/attachments/archive`,
      { format: extension }
    );
    const fileName = `${documentId}-attachments.${extension}`;
    const file = await context.files.write({ fileName, data: content });
    return { file, file_name: fileName, size: content.length };
  },
});
