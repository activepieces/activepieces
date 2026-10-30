import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoStats } from '../common/stats';
import { shortIoValues } from '../common/values';

export const listRecentClicksAction = createAction({
  auth: shortIoAuth,
  name: 'list_recent_clicks',
  displayName: 'List Recent Clicks',
  description: 'List the latest raw clicks on a domain (time, path, country, referrer, browser). Includes visitor IP and user agent.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the most recent individual clicks on a Short.io domain, newest first, with time, path, country, city, referrer, browser and OS. Output includes visitor IP addresses and user agents (personal data). Optional filter by link path and human clicks only. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.clicks,
  props: {
    domain: shortIoAiProps.domain(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many clicks to return (1-1000). Default 30.',
      required: false,
    }),
    paths: Property.Array({
      displayName: 'Link Paths',
      description: 'Only clicks on these paths, e.g. promo. Needs a Short.io Team plan.',
      required: false,
    }),
    humanOnly: Property.Checkbox({
      displayName: 'Human Clicks Only',
      description: 'Skip clicks Short.io identifies as bots.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = shortIoValues.optionalNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 1000 }) ?? 30;
    const paths = shortIoValues.stringList(propsValue.paths).map((path) => `/${path.replace(/^\/+/, '')}`);
    const include = shortIoValues.compact({
      paths: paths.length > 0 ? paths : undefined,
      human: propsValue.humanOnly === true ? true : undefined,
    });
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoStats.statsQuery({
        auth,
        domainId: domain.id,
        report: 'last_clicks',
        body: { limit, ...(Object.keys(include).length > 0 ? { include } : {}) },
      });
      const raw = Array.isArray(response) ? response : shortIoLinks.isRecord(response) && Array.isArray(response['clicks']) ? response['clicks'] : [];
      const items = raw.filter(shortIoLinks.isRecord);
      return { items, count: items.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 403: 'Raw click data is not available for this domain or plan.' } });
    }
  },
});
