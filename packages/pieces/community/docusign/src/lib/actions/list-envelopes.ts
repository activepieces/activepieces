import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';
import { Envelope, EnvelopesApi, EnvelopesInformation } from 'docusign-esign';

export const listEnvelopes = createAction({
  name: 'listEnvelopes',
  displayName: 'Search Envelopes',
  description: 'Search and list envelopes with optional filters.',
  auth: docusignAuth,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter envelopes by their current status.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: '' },
          { label: 'Created (draft)', value: 'created' },
          { label: 'Sent', value: 'sent' },
          { label: 'Delivered (viewed)', value: 'delivered' },
          { label: 'Completed', value: 'completed' },
          { label: 'Declined', value: 'declined' },
          { label: 'Voided', value: 'voided' },
        ],
      },
    }),
    fromDate: Property.DateTime({
      displayName: 'From Date',
      description: 'Return envelopes last changed on or after this date.',
      required: false,
    }),
    toDate: Property.DateTime({
      displayName: 'To Date',
      description: 'Return envelopes last changed on or before this date.',
      required: false,
    }),
    searchText: Property.ShortText({
      displayName: 'Search Text',
      description:
        'Filter by envelope name, recipient name, or recipient email.',
      required: false,
    }),
    include: Property.StaticMultiSelectDropdown({
      displayName: 'Include Extra Data',
      description: 'Additional data to include in each envelope.',
      required: false,
      options: {
        options: [
          { label: 'Recipients', value: 'recipients' },
          { label: 'Tabs', value: 'tabs' },
          { label: 'Documents', value: 'documents' },
          { label: 'Custom Fields', value: 'custom_fields' },
          { label: 'Folders', value: 'folders' },
          { label: 'Notifications', value: 'notifications' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const envelopeApiClient = new EnvelopesApi(apiClient);

    const getPage = async (startPosition: number) => {
      return await envelopeApiClient.listStatusChanges(propsValue.accountId, {
        count: '100',
        startPosition: startPosition.toString(),
        fromDate: propsValue.fromDate,
        toDate: propsValue.toDate,
        searchText: propsValue.searchText,
        status: propsValue.status || undefined,
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
