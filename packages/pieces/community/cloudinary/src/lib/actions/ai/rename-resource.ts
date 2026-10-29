import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryRenameResourceOutputSchema } from '../../output-schemas';

export const cloudinaryRenameResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_rename_resource',
  outputSchema: cloudinaryRenameResourceOutputSchema,
  displayName: 'Rename Resource',
  description: 'Changes an asset\'s public ID, optionally moving it to another delivery type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames an asset by changing its public ID (which also changes its delivery URL), and can move it between upload, private and authenticated delivery types. Fails if the target public ID exists unless Overwrite is set. The asset_id stays the same. Not idempotent: a second call fails because the source ID no longer exists.',
    idempotent: false,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    from_public_id: Property.ShortText({
      displayName: 'Current Public ID',
      description: 'The asset\'s current public ID.',
      required: true,
    }),
    to_public_id: Property.ShortText({
      displayName: 'New Public ID',
      description: 'The new public ID.',
      required: true,
    }),
    type: aiProps.deliveryType(),
    to_type: Property.StaticDropdown({
      displayName: 'New Delivery Type',
      description: 'Move the asset to this delivery type. Leave empty to keep it.',
      required: false,
      options: {
        options: [
          { label: 'Upload', value: 'upload' },
          { label: 'Private', value: 'private' },
          { label: 'Authenticated', value: 'authenticated' },
        ],
      },
    }),
    overwrite: aiProps.includeFlag({ displayName: 'Overwrite', description: 'Replace an existing asset that already has the new public ID.' }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    const body = {
      from_public_id: propsValue.from_public_id.trim(),
      to_public_id: propsValue.to_public_id.trim(),
      type: propsValue.type ?? 'upload',
      ...(propsValue.to_type ? { to_type: propsValue.to_type } : {}),
      ...(propsValue.overwrite ? { overwrite: true } : {}),
      ...(propsValue.invalidate ? { invalidate: true } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type}/rename`, body);
  },
});
