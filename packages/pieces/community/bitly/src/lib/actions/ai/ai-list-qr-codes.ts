import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlyApiCall, resolveGroupGuid } from '../../common/client';
import { optionalText } from '../../common/props';
import { BitlyPagination, qrCodeListOutputSchema } from '../../common/schemas';

export const aiListQrCodesAction = createAction({
  auth: bitlyAuth,
  name: 'ai_list_qr_codes',
  classification: 'SEARCH',
  displayName: 'List QR Codes',
  description: 'List the QR codes of a group, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists QR codes in a Bitly group with their QR Code ID, title and destination. Returns next_cursor; pass it as Cursor for the next page (empty means no more). Read-only.',
    idempotent: true,
  },
  outputSchema: qrCodeListOutputSchema,
  props: {
    group_guid: Property.ShortText({ displayName: 'Group GUID', description: 'From List Groups. Leave empty for the account default group.', required: false }),
    size: Property.Number({ displayName: 'Page Size', description: '1 to 100. Defaults to 20.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from the previous page.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const size = propsValue.size === undefined || propsValue.size === null ? 20 : Number(propsValue.size);
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      throw new Error('Page Size must be a whole number from 1 to 100.');
    }
    const guid = await resolveGroupGuid({ auth: context.auth.props, groupGuid: propsValue.group_guid });
    const response = await bitlyApiCall<{ qr_codes?: unknown[]; pagination?: BitlyPagination }>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/groups/${guid}/qr-codes`,
      query: { size, search_after: optionalText(propsValue.cursor) },
      operation: 'list QR codes',
    });
    return {
      qr_codes: response.qr_codes ?? [],
      next_cursor: response.pagination?.search_after || null,
    };
  },
});
