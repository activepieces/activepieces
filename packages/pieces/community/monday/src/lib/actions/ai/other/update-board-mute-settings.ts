import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { updateBoardMuteSettingsActionOutputSchema } from '../../../output-schemas';

export const updateBoardMuteSettingsAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_board_mute_settings',
  classification: 'WRITE',
  displayName: 'Update Board Mute Settings',
  description: 'Changes which notifications the connected user gets from a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set the connected user\'s own notification preferences for one monday.com board: mute everything, only mentions and assignments, or custom (choose any of assigned, mentioned, automation notify). Affects only the current user, never other board members. Safe to retry: the same settings converge on the same state.',
    idempotent: true,
  },
  outputSchema: updateBoardMuteSettingsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    mute_state: Property.StaticDropdown({
      displayName: 'Mute State',
      required: true,
      defaultValue: 'CUSTOM_SETTINGS',
      options: {
        options: [
          { label: 'Custom (choose below)', value: 'CUSTOM_SETTINGS' },
          { label: 'Only mentions and assignments', value: 'MENTIONS_AND_ASSIGNS_ONLY' },
          { label: 'Mute all for me', value: 'CURRENT_USER_MUTE_ALL' },
        ],
      },
    }),
    enabled: Property.StaticMultiSelectDropdown({
      displayName: 'Notify Me When',
      description: 'Only used with the Custom mute state.',
      required: false,
      options: {
        options: [
          { label: 'I am assigned', value: 'IM_ASSIGNED' },
          { label: 'I am mentioned', value: 'IM_MENTIONED' },
          { label: 'An automation notifies me', value: 'AUTOMATION_NOTIFIED' },
        ],
      },
    }),
  },
  async run(context) {
    const { board_id, mute_state, enabled } = context.propsValue;
    if (!ALLOWED_STATES.includes(mute_state)) {
      throw new Error(`Unsupported mute state: ${mute_state}`);
    }
    const enabledSettings = mondayApi.toStringArray(enabled);
    if (mute_state === 'CUSTOM_SETTINGS' && enabledSettings.length === 0) {
      throw new Error('Choose at least one "Notify Me When" option for the Custom mute state.');
    }

    const data = await makeClient(context.auth).query<{
      update_mute_board_settings: { board_id: string | null; mute_state: string | null; enabled: string[] | null }[] | null;
    }>({
      query: `mutation ($boardId: String!, $muteState: BoardMuteState!, $enabled: [CustomizableBoardSettings!]) {
        update_mute_board_settings(board_id: $boardId, mute_state: $muteState, enabled: $enabled) {
          board_id
          mute_state
          enabled
        }
      }`,
      variables: {
        boardId: board_id,
        muteState: mute_state,
        enabled: mute_state === 'CUSTOM_SETTINGS' ? enabledSettings : undefined,
      },
    });

    const setting = (data.update_mute_board_settings ?? [])[0];
    return {
      board_id: setting?.board_id ?? board_id,
      mute_state: setting?.mute_state ?? mute_state,
      enabled: (setting?.enabled ?? []).join(', ') || null,
    };
  },
});

const ALLOWED_STATES = ['CUSTOM_SETTINGS', 'MENTIONS_AND_ASSIGNS_ONLY', 'CURRENT_USER_MUTE_ALL'];
