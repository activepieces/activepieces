import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_update_space',
  displayName: 'Update Space',
  description: 'Changes the name, privacy, URL label or settings of a workspace.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, privacy, URL label, auto-join or announcement settings of a workspace; only the fields given are sent. The space id comes from List Organization Spaces, List Organizations or Get Top Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace, from List Organization Spaces, List Organizations or Get Top Spaces.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The new name of the workspace.' }),
    privacy: podioAiProps.choice({ required: false, displayName: 'Privacy', description: '"open" lets any employee join, "closed" is invite-only.', values: ['open', 'closed'] }),
    urlLabel: podioAiProps.text({ required: false, displayName: 'URL Label', description: 'The new URL label (slug) of the workspace.' }),
    autoJoin: podioAiProps.bool({ required: false, displayName: 'Auto Join', description: '"true" adds new employees automatically.' }),
    postOnNewApp: podioAiProps.bool({ required: false, displayName: 'Announce New Apps', description: '"true" posts a status update when an app is added.' }),
    postOnNewMember: podioAiProps.bool({ required: false, displayName: 'Announce New Members', description: '"true" posts a status update when a member joins.' }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: {
        name: propsValue.name,
        privacy: propsValue.privacy,
        url_label: propsValue.urlLabel,
        auto_join: podioUtils.toBool({ value: propsValue.autoJoin }),
        post_on_new_app: podioUtils.toBool({ value: propsValue.postOnNewApp }),
        post_on_new_member: podioUtils.toBool({ value: propsValue.postOnNewMember }),
      },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of name, privacy, urlLabel, autoJoin, postOnNewApp or postOnNewMember.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/space/${propsValue.spaceId}`, body });
  },
});
