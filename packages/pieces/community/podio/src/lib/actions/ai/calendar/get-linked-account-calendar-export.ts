import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const getLinkedAccountCalendarExportAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_account_calendar_export',
  displayName: 'Get Linked Account Calendar Export',
  description: 'Gets how the global calendar is exported to a linked external calendar account.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the export of the global Podio calendar of the connected user to one linked external calendar account: the target calendar, minimum priority and whether tasks are exported. Needs a calendar account linked to the connected Podio user; its id comes from Get Linked Accounts. Use Get Calendar Exports to list every global export.',
    idempotent: true,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked external calendar account, from Get Linked Accounts.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/calendar/export/linked_account/${propsValue.linkedAccountId}` });
  },
});
