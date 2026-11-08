import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';

async function renderQrImage({ auth, linkId, options }: { auth: ShortIoAuthValue; linkId: string; options: Record<string, unknown> }): Promise<{ data: Buffer; contentType: string }> {
  return shortIoClient.binaryRequest({
    auth,
    method: HttpMethod.POST,
    path: `/links/qr/${shortIoClient.seg({ value: linkId, label: 'Link ID' })}`,
    body: options,
  });
}

export const shortIoQr = { renderQrImage };
