import { createAction, Property } from '@activepieces/pieces-framework';
import { crawlsnapAuth } from '../common/auth';
import { crawlsnapGet } from '../common/client';

export const subdosnapScan = createAction({
  auth: crawlsnapAuth,
  name: 'subdosnap_scan',
  displayName: 'SubdoSnap: Scan Subdomains',
  description: 'Paginated subdomain enumeration for a domain.',
  props: {
    query: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain to enumerate subdomains for, e.g. example.com.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Pagination cursor from a previous response (data.cursor). Leave empty to fetch the first page.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return crawlsnapGet(auth, '/v1/subdo-snap/scan', {
      query: propsValue.query,
      cursor: propsValue.cursor,
    });
  },
});
