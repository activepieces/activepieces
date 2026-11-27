import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const getFileVersionLegalHoldAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_version_legal_hold',
  displayName: 'Get File Version Legal Hold',
  description: 'Gets the legal holds on a Box file version.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one file version legal hold by ID: the file, the file version and every legal hold policy assignment holding it. Needs admin rights and Box Governance.',
    idempotent: true,
  },
  props: {
    fileVersionLegalHoldId: Property.ShortText({
      displayName: 'File Version Legal Hold ID',
      description: 'ID of the file version legal hold record.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/file_version_legal_holds/${encodeURIComponent(propsValue.fileVersionLegalHoldId)}`,
    });
  },
});
