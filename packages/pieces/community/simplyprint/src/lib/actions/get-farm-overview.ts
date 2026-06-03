import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getFarmOverviewAction = createAction({
  auth: simplyprintAuth,
  name: 'get_farm_overview',
  displayName: 'Get Farm Overview',
  description:
    'One-shot fleet summary: total printer count plus per-bucket lists (online/offline, printing/paused, awaiting bed clear, in maintenance, requires-attention, AI failure detections, …). Use this instead of paginating "List Printers" when you just need counts and the printers in each state.',
  props: {},
  async run(context) {
    const res = await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'printers/GetFarmOverview',
    });
    return res as unknown as FarmOverviewResponse & { status: boolean; message?: string };
  },
});

/**
 * Bucket entries are `{id, name}` for each printer in the bucket.
 * `online` is the broad set; the per-state buckets (printing/paused/...)
 * are subsets keyed off the printer's current `PrinterStatus`. AI buckets
 * are subsets of `printing`/`paused`. See backend
 * `printers/GetFarmOverview` for the bucketing rules.
 */
export interface FarmOverviewPrinter {
  id: number;
  name: string;
}

export interface FarmOverviewBucket {
  count: number;
  printers: FarmOverviewPrinter[];
}

export interface FarmOverviewResponse {
  total: number;
  buckets: {
    online: FarmOverviewBucket;
    offline: FarmOverviewBucket;
    not_connected: FarmOverviewBucket;
    operational: FarmOverviewBucket;
    printing: FarmOverviewBucket;
    paused: FarmOverviewBucket;
    awaiting_bed_clear: FarmOverviewBucket;
    in_maintenance: FarmOverviewBucket;
    print_pending: FarmOverviewBucket;
    requires_attention: FarmOverviewBucket;
    ai_running: FarmOverviewBucket;
    ai_detected_low: FarmOverviewBucket;
    ai_detected_high: FarmOverviewBucket;
  };
}
