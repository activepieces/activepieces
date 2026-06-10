import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const listPrintHistoryAction = createAction({
  auth: simplyprintAuth,
  name: 'list_print_history',
  displayName: 'List Print History',
  description: 'List completed print jobs, optionally filtered to a single printer.',
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID (optional)',
      description: 'Restrict to jobs from a specific printer. Leave empty for all printers.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page (optional)',
      description: 'Page number (1-based). Defaults to 1.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of jobs to return per page (default 25, max 100).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    // jobs/GetPaginatedPrintJobs is POST-only — its `validate()` only declares
    // post_validation rules and reads page/page_size/printer_ids straight from
    // $this->POST.
    const body: Record<string, unknown> = {
      page: Math.max(1, Math.floor(context.propsValue.page ?? 1)),
      page_size: Math.min(100, context.propsValue.limit ?? 25),
    };
    if (context.propsValue.printerId) {
      body['printer_ids'] = [Number(context.propsValue.printerId)];
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'jobs/GetPaginatedPrintJobs',
      body,
    });
  },
});
