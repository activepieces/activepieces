import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { getBoardMuteSettingsActionOutputSchema } from '../../../output-schemas';

export const getBoardMuteSettingsAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_board_mute_settings',
  classification: 'READ',
  displayName: 'Get Board Mute Settings',
  description: 'Gets the notification mute state of one or more boards.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the notification mute state of one or more monday.com boards for the connected user (e.g. CURRENT_USER_MUTE_ALL, MENTIONS_AND_ASSIGNS_ONLY, or an owner-level MUTE_ALL / NOT_MUTED). Use before changing it with Update Board Mute Settings. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getBoardMuteSettingsActionOutputSchema,
  props: {
    board_ids: Property.Array({
      displayName: 'Board IDs',
      description: 'Boards to check. Resolve them with List Boards.',
      required: true,
    }),
  },
  async run(context) {
    const boardIds = mondayApi.toStringArray(context.propsValue.board_ids);
    if (boardIds.length === 0) {
      throw new Error('Provide at least one board ID.');
    }

    const data = await makeClient(context.auth).query<{ mute_board_settings: { board_id: string | null; mute_state: string | null }[] | null }>({
      query: `query ($boardIds: [ID!]!) {
        mute_board_settings(board_ids: $boardIds) {
          board_id
          mute_state
        }
      }`,
      variables: { boardIds },
    });

    const settings = (data.mute_board_settings ?? []).map((s) => ({
      board_id: s.board_id ?? null,
      mute_state: s.mute_state ?? null,
    }));

    return { settings, count: settings.length };
  },
});
