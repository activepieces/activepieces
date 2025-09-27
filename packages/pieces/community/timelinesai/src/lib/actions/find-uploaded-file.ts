import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { findUploadedFile as findUploadedFileProps } from '../common/properties';
import { findUploadedFile as findUploadedFileSchema } from '../common/schemas';
import { findUploadedFile as findUploadedFileMethod } from '../common/methods';

export const findUploadedFile = createAction({
  auth: timelinesaiAuth,
  name: 'findUploadedFile',
  displayName: 'Find Uploaded File',
  description: 'Locate an uploaded file by filename or identifier',
  props: findUploadedFileProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      findUploadedFileSchema
    );

    return await findUploadedFileMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
