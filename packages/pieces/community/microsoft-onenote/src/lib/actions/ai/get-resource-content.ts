import { ResponseType } from '@microsoft/microsoft-graph-client';

import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetResourceContentOutputSchema } from '../../output-schemas';

export const getResourceContentAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_resource_content',
  outputSchema: microsoftOnenoteGetResourceContentOutputSchema,
  displayName: 'Get Resource Content',
  description: 'Downloads an image or file from a OneNote page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Downloads an image or attached file from a OneNote page and returns it as a file. The resource ID is the part after /resources/ in a src or data attribute of Get Page Content's HTML.",
    idempotent: true,
  },
  props: {
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description:
        'The ID after /resources/ in an image src or file data URL from Get Page Content.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the downloaded file, with its extension. Defaults to the resource ID.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const data: ArrayBuffer = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/resources/${encodeURIComponent(propsValue.resourceId)}/content`)
      .responseType(ResponseType.ARRAYBUFFER)
      .get();
    const fileName = propsValue.fileName || propsValue.resourceId;
    const file = await files.write({ fileName, data: Buffer.from(data) });
    return { resourceId: propsValue.resourceId, fileName, size: data.byteLength, file };
  },
});
