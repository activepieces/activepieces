import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateSpaceOutputSchema } from '../../../output-schemas';

export const createSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_create_space',
  outputSchema: podioCreateSpaceOutputSchema,
  displayName: 'Create Space',
  description: 'Creates a workspace in an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new workspace in an organization, closed by default. The organization id comes from List Organizations.',
    idempotent: false,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the workspace.' }),
    privacy: podioAiProps.choice({ required: false, displayName: 'Privacy', description: '"open" lets any employee join, "closed" is invite-only. Defaults to "closed".', values: ['open', 'closed'] }),
    autoJoin: podioAiProps.bool({ required: false, displayName: 'Auto Join', description: '"true" adds new employees automatically. Defaults to "false".' }),
    postOnNewApp: podioAiProps.bool({ required: false, displayName: 'Announce New Apps', description: '"true" posts a status update when an app is added.' }),
    postOnNewMember: podioAiProps.bool({ required: false, displayName: 'Announce New Members', description: '"true" posts a status update when a member joins.' }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: {
        org_id: Number(propsValue.orgId),
        name: propsValue.name,
        privacy: propsValue.privacy,
        auto_join: podioUtils.toBool({ value: propsValue.autoJoin }),
        post_on_new_app: podioUtils.toBool({ value: propsValue.postOnNewApp }),
        post_on_new_member: podioUtils.toBool({ value: propsValue.postOnNewMember }),
      },
    });
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: '/space/', body });
  },
});
