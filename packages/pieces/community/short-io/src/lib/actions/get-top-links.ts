import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoStats } from '../common/stats';
import { shortIoValues } from '../common/values';

export const getTopLinksAction = createAction({
  auth: shortIoAuth,
  name: 'get_top_links',
  displayName: 'Get Top Links',
  description: 'Get the most-clicked link paths on a domain for a period.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the most-clicked link paths on a Short.io domain for a period, ordered by clicks (descending), with the click count of each. Custom period needs start and end dates (YYYY-MM-DD). Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.topLinks,
  props: {
    domain: shortIoAiProps.domain(),
    period: shortIoAiProps.period('Time period to rank links over. Default: last 30 days.'),
    startDate: shortIoAiProps.startDate(),
    endDate: shortIoAiProps.endDate(),
    tz: shortIoAiProps.timezone(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many links to return (1-100). Default 10.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = shortIoValues.optionalNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 10;
    const range = shortIoValues.statsRange({ period: propsValue.period, startDate: propsValue.startDate, endDate: propsValue.endDate });
    const tz = shortIoValues.validateTimezone(propsValue.tz);
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoStats.statsQuery({
        auth,
        domainId: domain.id,
        report: 'top',
        body: shortIoValues.compact({ column: 'path', limit, tz, ...range }),
      });
      const items = (Array.isArray(response) ? response : []).filter(shortIoLinks.isRecord).map((row) => ({
        path: row['column'] ?? row['path'],
        clicks: Number(row['score'] ?? 0),
      }));
      return { items, count: items.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 400: 'Short.io rejected the statistics period.' } });
    }
  },
});
