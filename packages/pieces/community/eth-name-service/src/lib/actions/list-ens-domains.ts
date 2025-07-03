import { createAction, Property } from '@activepieces/pieces-framework';
import { ensCommon } from '../common/common';

export const listEnsDomains = createAction({
  name: 'listEnsDomains',
  displayName: 'List ENS Domains',
  description: 'List the ENS domains for a given address.',
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Address to list ENS domains for',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;

    if (!address) {
      throw new Error('Address is required');
    }

    const query = `
    {
      domains(where: { owner: "${address.toLowerCase()}" }) {
          id
          name
          labelName
          labelhash
          parent {
            id
          }
          subdomains {
            id
            name
          }
          subdomainCount
          resolvedAddress {
            id
          }
          resolver {
            id
            address
          }
          ttl
          isMigrated
          createdAt
        }
    }
    `;

    const res = await ensCommon.apiCall(
      `https://gateway.thegraph.com/api/${context.auth}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`,
      'POST',
      { query }
    );
    if (res.errors) {
      throw new Error(res.errors[0].message);
    }

    return res.data.domains;
  },
});
