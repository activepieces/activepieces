import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateEmailGroupsAction = createAction({
  auth: podioAuth,
  name: 'podio_update_email_groups',
  displayName: 'Update Email Groups',
  description: 'Turns groups of Podio emails on or off for the current user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns groups of Podio emails on or off for the connected user; a group left unset keeps its current setting. Get Email Groups reads the current settings.',
    idempotent: true,
  },
  props: {
    digest: podioAiProps.bool({ required: false, displayName: 'Digest', description: '"true" turns the digest email on, "false" off.' }),
    bulletin: podioAiProps.bool({ required: false, displayName: 'Bulletin', description: '"true" turns the bulletin email on, "false" off.' }),
    reference: podioAiProps.bool({ required: false, displayName: 'Reference', description: '"true" turns reference emails on, "false" off.' }),
    message: podioAiProps.bool({ required: false, displayName: 'Message', description: '"true" turns message emails on, "false" off.' }),
    space: podioAiProps.bool({ required: false, displayName: 'Space', description: '"true" turns workspace emails on, "false" off.' }),
    subscription: podioAiProps.bool({ required: false, displayName: 'Subscription', description: '"true" turns subscription emails on, "false" off.' }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: {
        digest: podioUtils.toBool({ value: propsValue.digest }),
        bulletin: podioUtils.toBool({ value: propsValue.bulletin }),
        reference: podioUtils.toBool({ value: propsValue.reference }),
        message: podioUtils.toBool({ value: propsValue.message }),
        space: podioUtils.toBool({ value: propsValue.space }),
        subscription: podioUtils.toBool({ value: propsValue.subscription }),
      },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of digest, bulletin, reference, message, space or subscription.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: '/email/group/', body });
  },
});
