import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

type SplitDoc = Record<string, string | undefined>;
type SplitResponse = Record<string, SplitDoc[] | undefined>;

const SPLIT_ACTION_OPTIONS = [
  {
    label: 'Split After Page — split into two parts at a given page',
    value: 'SplitAfterPage',
  },
  {
    label: 'Recurring Split — split into equal chunks every N pages',
    value: 'RecurringSplitAfterPage',
  },
  {
    label: 'Split Sequence — split by a sequence of page counts',
    value: 'SplitSequence',
  },
  {
    label: 'Split Ranges — split using custom page ranges',
    value: 'SplitRanges',
  },
];

const SPLIT_ACTION_NUMBER_DESCRIPTIONS: Record<string, string> = {
  SplitAfterPage: 'Page number after which the PDF is split. E.g. 3 → produces pages 1–3 and the rest.',
  RecurringSplitAfterPage: 'Number of pages per chunk. E.g. 5 → splits into parts of 5 pages each.',
  SplitSequence: 'Number of pages in the first sequence chunk.',
  SplitRanges: 'Starting page number of the custom range.',
};

export const splitPdfAction = createAction({
  auth: pdf4meAuth,
  name: 'split_pdf',
  displayName: 'Split PDF',
  description: 'Splits a PDF file into multiple documents using one of four split strategies.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'The PDF file to split.',
      required: true,
    }),
    splitAction: Property.StaticDropdown({
      displayName: 'Split Strategy',
      description: 'How the PDF should be split.',
      required: true,
      defaultValue: 'SplitAfterPage',
      options: { options: SPLIT_ACTION_OPTIONS },
    }),
    splitSettings: Property.DynamicProperties({
      displayName: 'Split Settings',
      refreshers: ['splitAction'],
      auth: pdf4meAuth,
      required: true,
      props: async (propsValue) => {
        const action = String(propsValue['splitAction'] ?? 'SplitAfterPage');
        const description =
          SPLIT_ACTION_NUMBER_DESCRIPTIONS[action] ??
          'Number controlling the split behaviour for the chosen strategy.';
        return {
          splitActionNumber: Property.Number({
            displayName: 'Split Number',
            description,
            required: true,
            defaultValue: 1,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { file, splitAction, splitSettings } = context.propsValue;
    const splitActionNumber = splitSettings?.['splitActionNumber'] as number | undefined;

    const response = await pdf4meCommon.callJsonApi<SplitResponse>({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/SplitPDF',
      body: {
        docContent: file.data.toString('base64'),
        docName: file.filename,
        splitAction: splitAction ?? 'SplitAfterPage',
        splitActionNumber: splitActionNumber ?? 1,
        fileNaming: 'NameAsPerOrder',
      },
    });

    const docs = response.body['splited Documents'] ?? [];

    return {
      parts_count: docs.length,
      part_1_file_name: docs[0]?.['docName'] ?? docs[0]?.['name'] ?? null,
      part_1_file_data_base64: docs[0]?.['docContent'] ?? docs[0]?.['docData'] ?? null,
      part_2_file_name: docs[1]?.['docName'] ?? docs[1]?.['name'] ?? null,
      part_2_file_data_base64: docs[1]?.['docContent'] ?? docs[1]?.['docData'] ?? null,
    };
  },
});
