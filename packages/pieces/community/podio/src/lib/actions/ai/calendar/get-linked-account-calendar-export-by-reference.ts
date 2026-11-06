import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const getLinkedAccountCalendarExportByReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_account_calendar_export_by_reference',
  displayName: 'Get Linked Account Calendar Export by Reference',
  description: 'Gets how an app or workspace calendar is exported to a linked external calendar account.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the export of one app or workspace calendar to a linked external calendar account: the target calendar, minimum priority and whether tasks are exported. Needs a calendar account linked to the connected Podio user; its id comes from Get Linked Accounts. Use Get Calendar Exports by Reference to see every export of the object.',
    idempotent: true,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked external calendar account, from Get Linked Accounts.' }),
    refType: podioAiProps.choice({ required: true, displayName: 'Reference Type', description: 'The type of the object: "app" or "space".', values: ['app', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the app or workspace.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/calendar/export/linked_account/${propsValue.linkedAccountId}/${propsValue.refType}/${propsValue.refId}` });
  },
});
