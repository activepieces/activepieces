import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, kleapRequest, normalizeDomainQuery, resolveAppId, toList } from '../common/client';
import { appDropdown } from '../common/props';

const domainProp = (description = 'e.g. example.com') =>
  Property.ShortText({ displayName: 'Domain', description, required: true });

function cleanDomain(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

export const searchDomains = createAction({
  auth: kleapAuth,
  name: 'search_domains',
  displayName: 'Search Domains',
  description: 'Checks which domain names are free for a name, with their price.',
  props: {
    query: Property.ShortText({
      displayName: 'Name',
      description: 'A brand or business name, e.g. "Café Lumière" (spaces and accents are removed).',
      required: true,
    }),
    tlds: Property.ShortText({
      displayName: 'Extensions',
      description: 'Optional, comma-separated: com, ch, fr…',
      required: false,
    }),
  },
  async run(context) {
    const query = normalizeDomainQuery(context.propsValue.query);
    if (!query) throw new Error('The name is empty.');
    const body: JsonObject = { query };
    const tlds = toList(context.propsValue.tlds).map((t) => (t.startsWith('.') ? t : `.${t}`));
    if (tlds.length) body['tlds'] = tlds;
    return kleapRequest(context.auth, HttpMethod.POST, '/domains/search', { body });
  },
});

export const checkDomain = createAction({
  auth: kleapAuth,
  name: 'check_domain',
  displayName: 'Check Domain',
  description:
    'Registration, payment and connection status of a domain bought or connected through Kleap (e.g. after Buy Domain). For availability, use Search Domains.',
  props: { domain: domainProp() },
  async run(context) {
    const domain = cleanDomain(context.propsValue.domain);
    return kleapRequest(context.auth, HttpMethod.GET, `/domains/${encodeURIComponent(domain)}/check`);
  },
});

export const connectDomain = createAction({
  auth: kleapAuth,
  name: 'connect_domain',
  displayName: 'Connect Domain',
  description:
    'Connects a domain you already own to an app (paid plan required). Returns the DNS record to set at your registrar.',
  props: {
    app_id: appDropdown(),
    domain: domainProp('The domain you own, e.g. www.example.com'),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.POST, '/domains/connect', {
      body: { app_id: Number(appId), domain: cleanDomain(context.propsValue.domain) },
    });
  },
});

export const buyDomain = createAction({
  auth: kleapAuth,
  name: 'buy_domain',
  displayName: 'Buy Domain',
  description:
    'Creates a Stripe checkout link to buy a domain. Nothing is charged by this step: the domain is registered only after someone pays on the returned checkout_url.',
  props: {
    info: Property.MarkDown({
      value:
        '**The user must pay.** This step only returns a `checkout_url` (Stripe). Send it to the person who pays (email, Slack…). Once paid, Kleap registers the domain and, if you pick an app, connects it. Follow it with **Check Domain**.',
    }),
    domain: domainProp('The domain to buy, e.g. cafelumiere.com'),
    years: Property.Number({ displayName: 'Years', required: false, defaultValue: 1 }),
    app_id: appDropdown({
      required: false,
      description: 'Optional: connect the domain to this app once it is paid.',
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const body: JsonObject = { domain: cleanDomain(p.domain), years: Math.max(1, Number(p.years ?? 1)) };
    if (p.app_id) body['app_id'] = Number(await resolveAppId(context.auth, p.app_id));
    const checkout = await kleapRequest(context.auth, HttpMethod.POST, '/domains/checkout', { body });
    return {
      ...checkout,
      payment_required: true,
      next_step: `Open checkout_url and pay to register ${checkout['domain'] ?? body['domain']}. Nothing is registered until the payment succeeds; then use "Check Domain" to follow it.`,
    };
  },
});
