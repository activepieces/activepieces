import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth, DocusignAuthType } from '../..';
import { createApiClient } from '../common';
import { Envelope, EnvelopesApi, EnvelopesInformation } from 'docusign-esign';

export const listEnvelopes = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'listEnvelopes',
  displayName: 'List envelopes',
  description: 'List / search envelopes',
  auth: docusignAuth,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    fromDate: Property.DateTime({
      displayName: 'From date',
      required: false,
    }),
    toDate: Property.DateTime({
      displayName: 'To date',
      required: false,
    }),
    searchText: Property.ShortText({
      displayName: 'Search text',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
    include: Property.Array({
      displayName: 'Include (e.g. recipients)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth as DocusignAuthType);
    const envelopeApiClient = new EnvelopesApi(apiClient);

    const getPage = async (startPosition: number) => {
      return await envelopeApiClient.listStatusChanges(propsValue.accountId, {
        count: '100',
        startPosition: startPosition.toString(),
        fromDate: propsValue.fromDate,
        toDate: propsValue.toDate,
        searchText: propsValue.searchText,
        status: propsValue.status,
        include: propsValue.include?.join(','),
      });
    };
    let startPosition = 0;
    const envelopes: Envelope[] = [];
    let page: EnvelopesInformation | null = null;
    do {
      page = await getPage(startPosition);
      if (page.envelopes) {
        envelopes.push(...page.envelopes);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      startPosition = parseInt(page.endPosition!) + 1;
    } while (
      page.endPosition &&
      page.totalSetSize &&
      parseInt(page.endPosition) + 1 < parseInt(page.totalSetSize)
    );
    return envelopes;
  },
});
