import { createAction, Property } from '@activepieces/pieces-framework';

import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCopyFileToDefaultContentLocationOutputSchema } from '../../../output-schemas';

export const copyFileToDefaultContentLocationAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_copy_file_to_default_content_location',
  outputSchema: microsoftSharepointCopyFileToDefaultContentLocationOutputSchema,
  displayName: 'Copy File to Default Content Location',
  description: "Copies a file into a content type's document template location.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Copies one file from a document library into the default content location of a site content type, where its document template lives, for example to set the template. List Content Types returns the content type IDs and List Folder Children or Find File the file's drive and item IDs.",
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description: 'ID of the site content type, like "0x0101...". Use List Content Types to find it.',
      required: true,
    }),
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({
      required: true,
      displayName: 'File ID',
      description: 'ID of the file (drive item) to copy. Use List Folder Children or Find File to find it.',
    }),
    destinationFileName: Property.ShortText({
      displayName: 'Destination File Name',
      description: 'Name of the copy, like "template.docx". Leave empty to keep the source file name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = microsoftSharePointClient.create({ auth });
    const file: DriveItem = await client
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`)
      .select('sharepointIds')
      .get();
    const listId = file.sharepointIds?.listId;
    const listItemId = file.sharepointIds?.listItemId;
    if (!listId || !listItemId) {
      throw new Error('File ID must be a file in a SharePoint document library; this item has no SharePoint list IDs.');
    }
    await client
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/copyToDefaultContentLocation`
      )
      .post({
        sourceFile: { sharepointIds: { listId, listItemId } },
        ...(propsValue.destinationFileName !== undefined
          ? { destinationFileName: propsValue.destinationFileName }
          : {}),
      });
    return { success: true, contentTypeId: propsValue.contentTypeId };
  },
});
