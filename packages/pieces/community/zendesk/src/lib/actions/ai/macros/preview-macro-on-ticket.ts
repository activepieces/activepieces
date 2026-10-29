import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskPreviewMacroOnTicketOutputSchema } from '../../../output-schemas';

export const zendeskPreviewMacroOnTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_preview_macro_on_ticket',
  outputSchema: zendeskPreviewMacroOnTicketOutputSchema,
  displayName: 'Preview Macro on Ticket',
  description: 'Show how a ticket would look after applying a macro.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Computes the changes a macro would make to one ticket, including the rendered comment text, without saving anything. To apply it, pass the returned ticket fields and comment to Update Ticket and Add Ticket Comment.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    macro_id: zendeskAiProps.requiredId({ displayName: 'Macro ID', description: 'Numeric macro ID, from List Macros or Search Macros.' }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const macroId = zendeskApi.id({ value: propsValue.macro_id, label: 'Macro ID' });
    const response = await zendeskApi.request<{ result: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/macros/${macroId}/apply.json`,
    });
    return response.result;
  },
});
