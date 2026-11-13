import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserStatusOutputSchema } from '../../../output-schemas';

export const updateUserStatusAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_user_status',
  outputSchema: mattermostGetUserStatusOutputSchema,
  displayName: 'Update User Status',
  description: 'Sets a user\'s presence status.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Manually sets a user\'s presence to online, away, offline or dnd (do not disturb); it stays until set to online again, which returns it to automatic. DND End Time only goes with dnd. Another user needs permission to edit other users. For a custom status message use Set Custom Status.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"online", "away", "offline" or "dnd" (do not disturb).',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Online', value: 'online' },
          { label: 'Away', value: 'away' },
          { label: 'Offline', value: 'offline' },
          { label: 'Do Not Disturb', value: 'dnd' },
        ],
      },
    }),
    dndEndTime: Property.Number({
      displayName: 'DND End Time',
      description: 'Unix time in seconds when do not disturb ends. Only with status "dnd"; leave empty for no end.',
      required: false,
    }),
  },
  async run(context) {
    const { userId, status, dndEndTime } = context.propsValue;
    if (!STATUSES.includes(status)) {
      throw new Error(`Status must be one of ${STATUSES.join(', ')}, got "${status}".`);
    }
    const hasDndEndTime = dndEndTime !== undefined && dndEndTime !== null;
    if (hasDndEndTime && status !== 'dnd') {
      throw new Error('DND End Time can only be set with status "dnd".');
    }
    const resolvedUserId = userId === 'me' ? (await mattermostApi.getMe({ auth: context.auth })).id : userId;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(resolvedUserId)}/status`,
      body: {
        user_id: resolvedUserId,
        status,
        ...(hasDndEndTime ? { dnd_end_time: dndEndTime } : {}),
      },
    });
  },
});

const STATUSES = ['online', 'away', 'offline', 'dnd'];
