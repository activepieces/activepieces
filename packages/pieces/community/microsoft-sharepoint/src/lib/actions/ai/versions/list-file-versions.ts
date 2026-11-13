import { createAction } from '@activepieces/pieces-framework';
import type { DriveItemVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListFileVersionsOutputSchema } from '../../../output-schemas';

export const listFileVersionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_file_versions',
  outputSchema: microsoftSharepointListFileVersionsOutputSchema,
  displayName: 'List File Versions',
  description: 'Lists the versions of a file in a document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the versions of a file in a document library, newest first, with their version IDs, sizes and modification details, one page at a time. The first version is the current one. Use List Folder Children or Find File to get the file ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<DriveItemVersion>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/versions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
