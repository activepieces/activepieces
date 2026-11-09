import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetUserProfilesWithAccessToObjectOutputSchema } from '../../../output-schemas';

export const getUserProfilesWithAccessToObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_profiles_with_access_to_object',
  outputSchema: podioGetUserProfilesWithAccessToObjectOutputSchema,
  displayName: 'Get User Profiles With Access to Object',
  description: 'Lists the users who can access an object, through a grant or as workspace members.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the profiles of users who can access one Podio object, either through an explicit grant or as members of its workspace. Use Count User Profiles With Access to Object when only the number is needed.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the action that returns that object.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of profiles to return for each access type. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const profiles = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/reference/${propsValue.refType}/${propsValue.refId}/accessible_by/`,
      query: podioUtils.query({ values: { limit: propsValue.limit ?? 20, offset: propsValue.offset } }),
    });
    return { profiles, count: profiles.length };
  },
});
