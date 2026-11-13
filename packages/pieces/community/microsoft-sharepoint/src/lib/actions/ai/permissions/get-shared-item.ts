import { createAction, Property } from '@activepieces/pieces-framework';
import type { SharedDriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetSharedItemOutputSchema } from '../../../output-schemas';

export const getSharedItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_shared_item',
  outputSchema: microsoftSharepointGetSharedItemOutputSchema,
  displayName: 'Get Shared Item',
  description: 'Gets the item behind a sharing link.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Resolves a SharePoint or OneDrive sharing URL to the shared item\'s ID, name and owner. Takes the full sharing URL, like one returned by Create Sharing Link.',
    idempotent: true,
  },
  props: {
    sharingUrl: Property.ShortText({
      displayName: 'Sharing URL',
      description: 'The full sharing link URL. Create Sharing Link returns it as link.webUrl.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const sharedItem: SharedDriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(`/shares/${encodeURIComponent(microsoftSharePointUtils.shareToken({ share: propsValue.sharingUrl }))}`)
      .get();
    return sharedItem;
  },
});
