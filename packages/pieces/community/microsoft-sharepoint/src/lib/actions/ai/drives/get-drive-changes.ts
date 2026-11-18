import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetDriveChangesOutputSchema } from '../../../output-schemas';

export const getDriveChangesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_drive_changes',
  outputSchema: microsoftSharepointGetDriveChangesOutputSchema,
  displayName: 'Get Drive Changes',
  description: 'Lists files and folders that changed in a document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files and folders created, changed or deleted in a document library, one page at a time. The first call returns every item; follow @odata.nextLink, then keep the final @odata.deltaLink and pass it as Next Link later to get only newer changes. Start From Latest skips the existing items and returns just a delta link.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    startFromLatest: Property.StaticDropdown({
      displayName: 'Start From Latest',
      description:
        'Set to "true" to skip the current items and return only a @odata.deltaLink for future changes. Ignored when Next Link is set.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({
      required: false,
      description:
        'The @odata.nextLink or @odata.deltaLink value from a previous call, to get the next page or the changes since then. Leave empty to start.',
    }),
  },
  async run({ auth, propsValue }) {
    const startFromLatest = microsoftSharePointUtils.booleanChoice({
      value: propsValue.startFromLatest,
      propName: 'Start From Latest',
    });
    return await microsoftSharePointClient.list<DriveItem>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/root/delta`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
      query: startFromLatest ? { token: 'latest' } : undefined,
    });
  },
});
