import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const checkInFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_check_in_file',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Check In File',
  description: 'Checks in a checked-out file so its changes become visible to others.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Checks in a file previously checked out with Check Out File, saving the changes as a new version with your comment and releasing the lock. Use Discard Checkout to drop the changes instead; checking in a file that is not checked out fails.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Check-in comment saved with the new version.',
      required: true,
    }),
    publish: Property.StaticDropdown({
      displayName: 'Publish',
      description:
        'Set to "true" to publish the file as a major version after check-in. Leave empty for the library default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const publish = microsoftSharePointUtils.booleanChoice({
      value: propsValue.publish,
      propName: 'Publish',
    });
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/checkin`
      )
      .post({
        comment: propsValue.comment,
        ...(publish ? { checkInAs: 'published' } : {}),
      });
    return { success: true };
  },
});
