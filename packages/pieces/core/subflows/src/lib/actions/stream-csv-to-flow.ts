import { createAction, Property } from '@activepieces/pieces-framework';
import { streamUtils } from '@activepieces/pieces-common';
import { createCsvParser, CsvRow } from '../csv';
import { dispatchToSubflow, findEnabledSubflowOrThrow, subflowDropdown } from '../common';
import { fanOutBatches } from '../fan-out';

const MAX_IN_FLIGHT = 5;
const MAX_BATCH_SIZE = 10_000;

export const streamCsvToSubflows = createAction({
  audience: 'both',
  name: 'streamCsvToSubflows',
  classification: 'WRITE',
  displayName: 'Stream CSV to Subflows',
  description:
    'Call a subflow once per batch of CSV rows, reading the file as a stream.',
  aiMetadata: { description: 'Streams a CSV (a URL, an uploaded file, or a file from a previous step) and dispatches one subflow run per batch of rows. Pick it over Call Flow when the CSV is too large to hold in memory, since it is parsed as a stream and batches are fanned out with bounded concurrency. Rows per batch must be an integer between 1 and 10000 and the target subflow must be published with a "Callable Flow" trigger; not idempotent, since every batch dispatches a new subflow run.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'CSV File',
      description: 'A URL, an uploaded file, or a file from a previous step.',
      required: true,
      streaming: true,
    }),
    subflow: subflowDropdown({
      displayName: 'Subflow',
      description: 'Called once per batch. Inactive flows must be enabled first.',
    }),
    batchSize: Property.Number({
      displayName: 'Rows per Batch',
      description: `Between 1 and ${MAX_BATCH_SIZE} rows per subflow call.`,
      required: true,
      defaultValue: 100,
    }),
    delimiter: Property.StaticDropdown({
      displayName: 'Delimiter',
      description: 'How columns are separated in the file.',
      required: true,
      defaultValue: ',',
      display: 'cards',
      options: {
        options: [
          { label: 'Comma', value: ',', description: 'a,b,c' },
          { label: 'Tab', value: '\t', description: 'Tab key' },
        ],
      },
    }),
    extraData: Property.Json({
      displayName: 'Extra Data',
      description: 'Sent with every batch alongside the rows.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'csv', display: 'section', label: 'CSV', icon: 'file', props: ['file', 'delimiter'] },
    { key: 'subflow', display: 'section', label: 'Subflow', icon: 'send', props: ['subflow', 'batchSize'] },
  ],
  async run(context) {
    const { file, batchSize, delimiter, extraData } = context.propsValue;
    const { body } = streamUtils.toStreamingBody(file);
    if (
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > MAX_BATCH_SIZE
    ) {
      body.destroy();
      throw new Error(
        JSON.stringify({
          message: `Rows per batch must be an integer between 1 and ${MAX_BATCH_SIZE}.`,
        })
      );
    }

    const flow = await findEnabledSubflowOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.subflow,
    }).catch((error) => {
      body.destroy();
      throw error;
    });

    let firstRow: CsvRow | undefined;
    const { parser, getHeaders } = createCsvParser({ delimiter });
    body.pipe(parser);
    body.on('error', (err) => {
      if (!parser.destroyed) {
        parser.destroy(err);
      }
    });

    const dispatch = async ({
      batchIndex,
      rows,
    }: {
      batchIndex: number;
      rows: CsvRow[];
    }): Promise<void> => {
      if (batchIndex === 0) {
        firstRow = rows[0];
      }
      await dispatchToSubflow({
        apiUrl: context.server.apiUrl,
        flowId: flow.id,
        parentRunId: context.run.id,
        failParentOnFailure: false,
        data: { batchIndex, headers: getHeaders(), rows, extraData },
        retries: 2,
      });
    };

    try {
      const result = await fanOutBatches<CsvRow>({
        records: parser,
        batchSize,
        maxInFlight: MAX_IN_FLIGHT,
        dispatch,
      });
      return { headers: getHeaders(), firstRow, ...result };
    } finally {
      parser.destroy();
      body.destroy();
    }
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
      hide: false,
    },
    retryOnFailure: {
      defaultValue: false,
      hide: true,
    },
  },
});
