import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointRestoreListItemVersionOutputSchema } from '../../../output-schemas';

export const restoreListItemVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_restore_list_item_version',
  outputSchema: microsoftSharepointRestoreListItemVersionOutputSchema,
  displayName: 'Restore List Item Version',
  description: 'Restores a previous version of a SharePoint list item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a previous version of a SharePoint list item the current one by saving its field values as a new version; all existing versions are kept. Each call adds another version. List List Item Versions returns the version IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description:
        'ID of the list item version to restore, like "1.0". Use List List Item Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/versions/${encodeURIComponent(propsValue.versionId)}/restoreVersion`
      )
      .post(undefined);
    return {
      success: true,
      siteId: propsValue.siteId,
      listId: propsValue.listId,
      listItemId: propsValue.listItemId,
      versionId: propsValue.versionId,
    };
  },
});
