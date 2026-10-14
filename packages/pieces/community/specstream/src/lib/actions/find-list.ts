import { randomUUID } from 'crypto';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { specstreamAuth } from '../auth';
import { specstreamApi } from '../common/client';

type Reading = { status: string; ast_hash: string; canonical_sentence?: string };
type Quote = { quote_id: string; quote_hash: string; maximum_cents: number };
type Execution = { find_id: string; status?: string };

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const findListAction = createAction({
  auth: specstreamAuth,
  name: 'find_list',
  classification: 'WRITE',
  displayName: 'Find a List',
  description: 'Asks for a list in plain words and starts it if the price is within your maximum.',
  audience: 'human',
  aiMetadata: {
    description:
      'Starts a SpecStream list from a plain-English request (what every row must meet and the details to bring back). SpecStream prices the request first; the run starts only when that price is at or below Maximum Price, otherwise the step fails with the price and nothing is charged. Returns the list ID and link while the list is still running; rows arrive through the New Row in a Finished List trigger or Get List Results. Spends money from the SpecStream balance, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    request: Property.LongText({
      displayName: 'What to Find',
      description:
        'Describe the list in plain words, with what every row must meet and the details to bring back. Example: "Roofing companies in Columbus, Ohio with their website and phone".',
      required: true,
    }),
    count: Property.Number({
      displayName: 'Number of Results',
      description: 'How many matching rows to find. You pay only for rows that match.',
      required: true,
      defaultValue: 25,
    }),
    maxPrice: Property.Number({
      displayName: 'Maximum Price (USD)',
      description:
        'The most this list may cost. If the price comes back higher, nothing runs and the step stops with the price. See [pricing](https://specstream.ai/pricing).',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const q = context.propsValue.request.trim();
    const count = Math.floor(Number(context.propsValue.count));
    const maxCents = Math.round(Number(context.propsValue.maxPrice) * 100);
    if (!q) throw new Error('Describe the list to find.');
    if (!Number.isSafeInteger(count) || count < 1) throw new Error('Number of Results must be 1 or more.');
    if (!Number.isSafeInteger(maxCents) || maxCents <= 0) throw new Error('Maximum Price must be more than 0.');

    const reading = await specstreamApi.call<Reading>({
      apiKey,
      method: HttpMethod.POST,
      path: '/v1/parse',
      body: { q, locale: 'en-US' },
    });
    if (reading.status !== 'runnable') {
      throw new Error(
        `SpecStream needs a clearer request before it can price it. It read: "${reading.canonical_sentence ?? q}". Add the place or what every row must meet.`,
      );
    }
    const quote = await specstreamApi.call<Quote>({
      apiKey,
      method: HttpMethod.POST,
      path: '/v1/capacity/quotes',
      body: { ast_hash: reading.ast_hash, operation: 'find', requested_units: count },
    });
    if (quote.maximum_cents > maxCents) {
      throw new Error(
        `This list can cost up to ${dollars(quote.maximum_cents)}, above your maximum of ${dollars(maxCents)}. Raise the maximum or ask for fewer results.`,
      );
    }
    const run = await specstreamApi.call<Execution>({
      apiKey,
      method: HttpMethod.POST,
      path: '/v1/capacity/executions',
      body: {
        quote_id: quote.quote_id,
        quote_hash: quote.quote_hash,
        confirm_max_cents: quote.maximum_cents,
        idempotency_key: `activepieces-${randomUUID()}`,
      },
    });
    return {
      list_id: run.find_id,
      status: run.status ?? 'running',
      request: reading.canonical_sentence ?? q,
      number_of_results: count,
      maximum_price_usd: quote.maximum_cents / 100,
      list_link: specstreamApi.listLink(run.find_id),
    };
  },
});
