import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';
import { DubLink } from '../common/common';

export const getLink = createAction({
  name: 'get_link',
  displayName: 'Get Link',
  description: 'Retrieve details of a specific Dub link by its ID, external ID, or domain + key.',
  auth: dubAuth,
  props: {
    lookupMethod: Property.StaticDropdown({
      displayName: 'Look Up By',
      description: 'How to identify the link you want to retrieve.',
      required: true,
      defaultValue: 'linkId',
      options: {
        options: [
          { label: 'Link ID', value: 'linkId' },
          { label: 'External ID', value: 'externalId' },
          { label: 'Domain + Key', value: 'domainKey' },
        ],
      },
    }),
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The Dub-generated link ID (e.g. `clv3g2...`). Used when Look Up By = Link ID.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your internal ID for the link. Pass with prefix `ext_` (e.g. `ext_123456`). Used when Look Up By = External ID.',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain of the link (e.g. `dub.sh`). Used when Look Up By = Domain + Key.',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'Key (Slug)',
      description: 'The slug of the link (e.g. `my-promo`). Used when Look Up By = Domain + Key.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { lookupMethod, linkId, externalId, domain, key } = propsValue;

    let url: string;

    switch (lookupMethod) {
      case 'linkId':
        if (!linkId) throw new Error('Link ID is required when Look Up By = Link ID.');
        url = `${DUB_API_BASE}/links/${linkId}`;
        break;
      case 'externalId':
        if (!externalId) throw new Error('External ID is required when Look Up By = External ID.');
        url = `${DUB_API_BASE}/links/info?externalId=${encodeURIComponent(externalId)}`;
        break;
      case 'domainKey':
        if (!domain || !key)
          throw new Error('Both Domain and Key are required when Look Up By = Domain + Key.');
        url = `${DUB_API_BASE}/links/info?domain=${encodeURIComponent(domain)}&key=${encodeURIComponent(key)}`;
        break;
      default:
        throw new Error(`Unsupported lookup method: ${lookupMethod}`);
    }

    const response = await httpClient.sendRequest<DubLink>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
