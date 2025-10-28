import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common';
import { getFileProperties } from '../common/properties';
import { getFileSchema } from '../common/schemas';

export const getFile = createAction({
  auth: vlmRunAuth,
  name: 'getFile',
  displayName: 'Get File',
  description: "Gets file's metadata by ID.",
  props: getFileProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, getFileSchema);
    return await vlmRunCommon.getFile({ apiKey, file_id: propsValue.fileId });
  },
});
