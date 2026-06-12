import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

/**
 * Factory for the printer-action class of endpoints (pause, resume, cancel).
 * They take a printer id via the `pid` query param and no body.
 *
 * Printer ID is a free-form Number — automation flows always source it from
 * an upstream step (trigger payload, "List Printers" output, MCP response, …)
 * rather than hand-picking a printer at design time, so a fleet dropdown
 * would be friction.
 */
export function createPrinterAction(opts: {
  name: string;
  displayName: string;
  description: string;
  path: string;
  aiMetadata?: { description: string; idempotent?: boolean };
}) {
  return createAction({
    auth: simplyprintAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    audience: 'both',
    aiMetadata: opts.aiMetadata,
    props: {
      printerId: Property.Number({
        displayName: 'Printer ID',
        description: 'Numeric printer ID. Typically piped in from an upstream step.',
        required: true,
      }),
    },
    async run(context) {
      return await simplyprintClient.simplyprintCall({
        auth: context.auth,
        method: HttpMethod.POST,
        path: opts.path,
        queryParams: { pid: String(context.propsValue.printerId) },
      });
    },
  });
}
