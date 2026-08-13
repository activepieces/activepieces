import { createAction, Property } from '@activepieces/pieces-framework';
import { createCsvParser, CsvRow } from '../csv';
import { dispatchToSubflow, findEnabledSubflowOrThrow, subflowDropdown } from '../common';
import { fanOutBatches } from '../fan-out';

const MAX_IN_FLIGHT = 5;
const MAX_BATCH_SIZE = 10_000;

export const streamCsvToSubflows = createAction({
  audience: 'both',
  name: 'streamCsvToSubflows',
  displayName: 'Stream CSV to Subflows',
  description:
    'Stream a CSV and call a subflow once per batch of rows, without loading the whole file into memory.',
  aiMetadata: { description: 'Streams a CSV (a URL, an uploaded file, or a file from a previous step) and dispatches one subflow run per batch of rows. Pick it over Call Flow when the CSV is too large to hold in memory, since it is parsed as a stream and batches are fanned out with bounded concurrency. Rows per batch must be an integer between 1 and 10000 and the target subflow must be published with a "Callable Flow" trigger; not idempotent, since every batch dispatches a new subflow run.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'CSV File',
      description:
        'The CSV to stream. Accepts a URL, an uploaded file, or a file from a previous step. It is streamed, not loaded into memory.',
      required: true,
      streaming: true,
    }),
    subflow: subflowDropdown({
      displayName: 'Subflow',
      description:
        'The subflow to call for each batch. Published flows with a "Callable Flow" trigger appear here; disabled flows are marked "(inactive)".',
    }),
    batchSize: Property.Number({
      displayName: 'Rows per batch',
      description: `How many CSV rows to send in each subflow call. Between 1 and ${MAX_BATCH_SIZE}.`,
      required: true,
      defaultValue: 100,
    }),
    delimiter: Property.StaticDropdown({
      displayName: 'Delimiter',
      required: true,
      defaultValue: ',',
      options: {
        options: [
          { label: 'Comma', value: ',' },
          { label: 'Tab', value: '\t' },
        ],
      },
    }),
    extraData: Property.Json({
      displayName: 'Extra Data',
      description:
        'Optional data sent to every subflow call alongside the batch rows. Reference the output of a previous step.',
      required: false,
    }),
  },
  async run(context) {
    const { file, batchSize, delimiter, extraData } = context.propsValue;
    if (
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > MAX_BATCH_SIZE
    ) {
      file.body.destroy();
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
      file.body.destroy();
      throw error;
    });

    let firstRow: CsvRow | undefined;
    const { parser, getHeaders } = createCsvParser({ delimiter });
    file.body.pipe(parser);
    file.body.on('error', (err) => {
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
      file.body.destroy();
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
