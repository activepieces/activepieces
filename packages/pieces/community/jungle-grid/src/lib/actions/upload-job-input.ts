import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const uploadJobInput = createAction({
  auth: jungleGridAuth,
  name: 'upload_job_input',
  displayName: 'Upload Job Input',
  description:
    'Upload a file or script to Jungle Grid managed input storage and return an input ID that can be passed to Submit Job.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'File from a previous Activepieces step to upload to Jungle Grid.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Optional override. Defaults to the original Activepieces filename.',
      required: false,
    }),
    content_type: Property.ShortText({
      displayName: 'MIME Type',
      description: 'Optional MIME type override. Defaults to the file MIME type when available.',
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Choose Input for data files or Script for files mounted under `/workspace/scripts`.',
      required: false,
      defaultValue: 'input',
      options: {
        options: [
          { label: 'Input', value: 'input' },
          { label: 'Script', value: 'script' },
        ],
      },
    }),
  },
  async run(context) {
    return await jungleGridCommon.uploadJobInput({
      auth: context.auth,
      file: context.propsValue.file,
      filename: context.propsValue.filename,
      contentType: context.propsValue.content_type,
      kind: context.propsValue.kind,
    });
  },
});
