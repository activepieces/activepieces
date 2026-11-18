import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';

export const listSitesAction = createAction({
  name: 'list_sites',
  classification: 'SEARCH',
  auth: matomoAuth,
  displayName: 'List Sites',
  description: 'List the Matomo sites this token can view.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Matomo website the connection token can at least view, with idsite, name, main_url, timezone, currency and ts_created. Use it to find the siteId other Matomo tools accept. Takes no input. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: {
    fields: [
      { key: 'count', label: 'Sites Found', format: 'number' },
      {
        key: 'sites',
        label: 'Sites',
        labelKey: 'name',
        listItems: [
          { key: 'idsite', label: 'Site ID' },
          { key: 'name', label: 'Name' },
          { key: 'main_url', label: 'Main URL', format: 'url' },
          { key: 'timezone', label: 'Timezone' },
          { key: 'currency', label: 'Currency' },
          { key: 'ts_created', label: 'Created At' },
        ],
      },
    ],
  },
  async run(context) {
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'SitesManager.getSitesWithAtLeastViewAccess',
      withoutSite: true,
    });
    const sites = matomoApi.toArray(response).filter(matomoApi.isRecord).map((site) => ({
      idsite: site['idsite'],
      name: site['name'],
      main_url: site['main_url'],
      timezone: site['timezone'],
      currency: site['currency'],
      ts_created: site['ts_created'],
    }));
    return { count: sites.length, sites };
  },
});
