import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCountObjectTasksOutputSchema } from '../../../output-schemas';

export const countUserProfilesWithAccessToObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_count_user_profiles_with_access_to_object',
  outputSchema: podioCountObjectTasksOutputSchema,
  displayName: 'Count User Profiles With Access to Object',
  description: 'Counts the other users who can access an object.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Counts the users other than the connected user who can access one Podio object, through a grant or as members of its workspace. Use Get User Profiles With Access to Object to see who they are.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the action that returns that object.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/reference/${propsValue.refType}/${propsValue.refId}/accessible_by/count` });
  },
});
