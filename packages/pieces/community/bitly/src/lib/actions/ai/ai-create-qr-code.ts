import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { bitlyApiCall, resolveGroupGuid } from '../../common/client';
import { optionalText } from '../../common/props';
import { qrCodeOutputSchema } from '../../common/schemas';
import { buildQrDestination } from '../create-qr-code';

export const aiCreateQrCodeAction = createAction({
  auth: bitlyAuth,
  name: 'ai_create_qr_code',
  classification: 'WRITE',
  displayName: 'Create QR Code',
  description: 'Create a plain QR code for a long URL or an existing Bitlink.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an unstyled Bitly QR code pointing to either a Long URL or an existing Bitlink ID (give exactly one), with an optional title. Returns the QR code with its qrcode_id. Not idempotent: every call creates a new QR code and uses the monthly QR quota.',
    idempotent: false,
  },
  outputSchema: qrCodeOutputSchema,
  props: {
    long_url: Property.ShortText({ displayName: 'Long URL', description: 'Starts with http:// or https://. Leave empty when using Bitlink ID.', required: false }),
    bitlink_id: Property.ShortText({ displayName: 'Bitlink ID', description: 'For example bit.ly/abc123. Leave empty when using Long URL.', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    group_guid: Property.ShortText({ displayName: 'Group GUID', description: 'From List Groups. Leave empty for the account default group.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const destination = buildQrDestination({ longUrl: propsValue.long_url, bitlinkId: propsValue.bitlink_id });
    const guid = await resolveGroupGuid({ auth: context.auth.props, groupGuid: propsValue.group_guid });
    const title = optionalText(propsValue.title);
    return bitlyApiCall({
      method: HttpMethod.POST,
      auth: context.auth.props,
      resourceUri: '/qr-codes',
      body: { group_guid: guid, destination, ...(title ? { title } : {}) },
      operation: 'create QR code',
    });
  },
});
