import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';
import { shortIoLinks } from './links';

async function setArchived({ auth, linkId, archived }: { auth: ShortIoAuthValue; linkId: string; archived: boolean }): Promise<{ linkId: string; archived: boolean }> {
  const id = linkId.trim();
  shortIoClient.seg({ value: id, label: 'Link ID' });
  try {
    const response = await shortIoClient.request({
      auth,
      method: HttpMethod.POST,
      path: archived ? '/links/archive' : '/links/unarchive',
      body: { link_id: id },
    });
    if (shortIoLinks.isRecord(response) && response['success'] === false) {
      throw new Error(`Short.io did not ${archived ? 'archive' : 'unarchive'} the link: ${shortIoClient.vendorMessage({ responseBody: response, fallback: 'unknown error' })}`);
    }
    return { linkId: id, archived };
  } catch (error) {
    return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Short link not found. Check the link ID.' } });
  }
}

export const shortIoArchive = { setArchived };
