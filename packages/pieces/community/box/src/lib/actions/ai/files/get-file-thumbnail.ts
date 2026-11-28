import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxDownloadFileOutputSchema } from '../../../output-schemas';

const EXTENSIONS = ['png', 'jpg'];

export const getFileThumbnailAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_thumbnail',
  outputSchema: boxDownloadFileOutputSchema,
  displayName: 'Get File Thumbnail',
  description: 'Gets a thumbnail image of a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a PNG or JPG thumbnail of a Box file as a downloadable file. Works for images, documents and videos Box can preview; other types fail. Get the ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    extension: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Image format: "png" or "jpg".',
      required: true,
      options: { options: EXTENSIONS.map((value) => ({ label: value, value })) },
    }),
    minWidth: Property.Number({ displayName: 'Min Width', description: 'Minimum width in pixels (32-320).', required: false }),
    minHeight: Property.Number({ displayName: 'Min Height', description: 'Minimum height in pixels (32-320).', required: false }),
    maxWidth: Property.Number({ displayName: 'Max Width', description: 'Maximum width in pixels (32-320).', required: false }),
    maxHeight: Property.Number({ displayName: 'Max Height', description: 'Maximum height in pixels (32-320).', required: false }),
  },
  async run({ auth, propsValue, files }) {
    if (!EXTENSIONS.includes(propsValue.extension)) {
      throw new Error(`Format must be one of: ${EXTENSIONS.join(', ')}.`);
    }
    const thumbnail = await boxClient.download({
      auth,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/thumbnail.${propsValue.extension}`,
      query: {
        min_width: boxUtils.optionalString({ value: propsValue.minWidth }),
        min_height: boxUtils.optionalString({ value: propsValue.minHeight }),
        max_width: boxUtils.optionalString({ value: propsValue.maxWidth }),
        max_height: boxUtils.optionalString({ value: propsValue.maxHeight }),
      },
    });
    const fileName = `${propsValue.fileId}-thumbnail.${propsValue.extension}`;
    const file = await files.write({ fileName, data: thumbnail.data });
    return { file, fileName, contentType: thumbnail.contentType, size: thumbnail.data.length };
  },
});
