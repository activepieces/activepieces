import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurApi } from '../../common/api';
import { parseurUtils } from '../../common/utils';
import { documentListOutputSchema } from '../../output-schemas';

const STATUS_OPTIONS = [
  'INCOMING',
  'ANALYZING',
  'PROGRESS',
  'PARSEDOK',
  'PARSEDKO',
  'QUOTAEXC',
  'SKIPPED',
  'SPLIT',
  'DELETED',
  'EXPORTKO',
  'TRANSKO',
  'INVALID',
].map((value) => ({ label: value, value }));

const ORDERING_OPTIONS = [
  'name',
  '-name',
  'created',
  '-created',
  'processed',
  '-processed',
  'status',
  '-status',
].map((value) => ({ label: value, value }));

export const listDocumentsAction = createAction({
  auth: parseurAuth,
  name: 'parseur_list_documents',
  outputSchema: documentListOutputSchema,
  displayName: 'List Documents',
  description: 'Lists documents in a mailbox, with filters and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists documents in one Parseur mailbox, newest first unless Ordering says otherwise, filtered by name, status or received date. Use it to find a document ID for Get Document, Reprocess Document, Skip Document, Copy Document or Delete Document. Set Include Result to "true" to also get each document\'s parsed data as a JSON string.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    search: parseurAiProps.search({
      required: false,
      description: 'Case-insensitive partial match on the document name.',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Only documents in this status. PARSEDOK = parsed, PARSEDKO = failed to parse, QUOTAEXC = out of credits, EXPORTKO = export failed.',
      required: false,
      options: { disabled: false, options: STATUS_OPTIONS },
    }),
    receivedAfter: Property.ShortText({
      displayName: 'Received After',
      description: 'Only documents received after this date, as yyyy-mm-dd.',
      required: false,
    }),
    receivedBefore: Property.ShortText({
      displayName: 'Received Before',
      description: 'Only documents received before this date, as yyyy-mm-dd.',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'IANA timezone for the date filters, e.g. "Asia/Singapore". Defaults to UTC.',
      required: false,
    }),
    ordering: Property.StaticDropdown({
      displayName: 'Ordering',
      description: 'Sort field; a leading "-" sorts descending.',
      required: false,
      options: { disabled: false, options: ORDERING_OPTIONS },
    }),
    includeResult: Property.StaticDropdown({
      displayName: 'Include Result',
      description:
        '"true" adds each document\'s parsed data as a JSON string in "result". Defaults to "false".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'true', value: 'true' },
          { label: 'false', value: 'false' },
        ],
      },
    }),
    page: parseurAiProps.page({ required: false }),
    limit: parseurAiProps.limit({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await parseurApi.listDocuments({
      auth,
      parserId: propsValue.mailboxId,
      query: {
        search: propsValue.search,
        status: propsValue.status,
        received_after: propsValue.receivedAfter,
        received_before: propsValue.receivedBefore,
        tz: propsValue.timezone,
        ordering: propsValue.ordering,
        with_result: propsValue.includeResult,
        ...parseurUtils.pageQuery({
          page: propsValue.page,
          limit: propsValue.limit,
        }),
      },
    });
  },
});
