import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { Printer } from '../common/types';

export const listPrintersAction = createAction({
  auth: simplyprintAuth,
  name: 'list_printers',
  displayName: 'List Printers',
  description: 'List every printer in your SimplyPrint account with current status.',
  props: {
    page: Property.Number({
      displayName: 'Page (optional)',
      description:
        'Specific page number (1-based). Leave empty to walk all pages and return every printer.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page size (optional)',
      description: 'Items per page (max 100). Defaults to 100 when paging is requested.',
      required: false,
    }),
  },
  async run(context) {
    // printers/Get reads page/page_size from $this->POST first, then GET.
    // Critically, get_validation caps page_size at 25 (the panel's hard
    // limit) while post_validation allows up to 100, so POST is the only
    // way to request 100-row pages or walk farms with >25 printers in a
    // reasonable number of round-trips.
    const explicitPage = context.propsValue.page;
    const pageSize = Math.min(100, context.propsValue.pageSize ?? 100);

    if (typeof explicitPage === 'number' && explicitPage >= 1) {
      // Single-page mode (additive 0.5.11 behaviour). Caller is
      // paginating themselves — return just that page.
      const res = await simplyprintClient.simplyprintCall<{
        data: Printer[];
        page_amount?: number;
        total?: number;
      }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: 'printers/Get',
        body: { page: Math.floor(explicitPage), page_size: pageSize },
      });
      return res;
    }

    // Default (0.5.10-compatible): walk every page and flatten.
    const all: Printer[] = [];
    const maxPages = 50;
    for (let page = 1; page <= maxPages; page++) {
      const res = await simplyprintClient.simplyprintCall<{
        data: Printer[];
        page_amount?: number;
      }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: 'printers/Get',
        body: { page, page_size: pageSize },
      });
      const batch = (res.data ?? []) as Printer[];
      all.push(...batch);
      const totalPages = res.page_amount ?? 1;
      if (page >= totalPages || batch.length < pageSize) break;
    }
    return all;
  },
});
