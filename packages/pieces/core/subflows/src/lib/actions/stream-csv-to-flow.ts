import {
  createAction,
  FAIL_PARENT_ON_FAILURE_HEADER,
  FlowStatus,
  PARENT_RUN_ID_HEADER,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Readable } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';
import axios from 'axios';
import { parse } from 'csv-parse';
import { findFlowByExternalIdOrThrow, listFlowsWithSubflowTrigger } from '../common';
import { fanOutBatches } from '../fan-out';

type FlowValue = {
  externalId: string;
};

type CsvRow = Record<string, string>;

const MAX_IN_FLIGHT = 5;
const MAX_DISPATCH_ATTEMPTS = 3;

export const streamCsvToSubflows = createAction({
  audience: 'human',
  name: 'streamCsvToSubflows',
  displayName: 'Stream CSV to Subflows',
  description:
    'Stream a CSV from a URL and call a subflow once per batch of rows, without loading the whole file into memory.',
  props: {
    fileUrl: Property.ShortText({
      displayName: 'CSV File URL',
      description:
        'A direct URL to the CSV file. It is streamed, not downloaded into memory.',
      required: true,
    }),
    flow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description:
        'The subflow to call for each batch. Published flows with a "Callable Flow" trigger appear here; disabled flows are marked "(inactive)".',
      required: true,
      refreshers: [],
      options: async (_, context) => {
        const flows = await listFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: { externalId: flow.externalId ?? flow.id },
            label:
              flow.status === FlowStatus.ENABLED
                ? flow.version.displayName
                : `${flow.version.displayName} (inactive)`,
          })),
        };
      },
    }),
    batchSize: Property.Number({
      displayName: 'Rows per batch',
      description: 'How many CSV rows to send in each subflow call.',
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
    const { fileUrl, batchSize, delimiter, extraData } = context.propsValue;
    if (!Number.isInteger(batchSize) || batchSize < 1) {
      throw new Error(
        JSON.stringify({ message: 'Rows per batch must be a positive integer.' })
      );
    }

    const flow = await findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.flow?.externalId,
    });
    if (flow.status !== FlowStatus.ENABLED) {
      throw new Error(
        JSON.stringify({
          message:
            'The selected subflow is disabled. Enable it before streaming to it.',
          externalId: context.propsValue.flow?.externalId,
          flowName: flow.version.displayName,
        })
      );
    }
    const webhookUrl = `${context.server.apiUrl.replace(/\/$/, '')}/v1/webhooks/${flow.id}`;

    const source = await axios.get<Readable>(fileUrl, {
      responseType: 'stream',
    });

    let headers: string[] = [];
    const parser = parse({
      delimiter,
      columns: (header: string[]) => {
        headers = header;
        return header;
      },
      skip_empty_lines: true,
      trim: true,
    });
    source.data.pipe(parser);
    source.data.on('error', (err) => parser.destroy(err));

    const dispatch = async ({
      batchIndex,
      rows,
    }: {
      batchIndex: number;
      rows: CsvRow[];
    }): Promise<void> => {
      let lastError: unknown;
      for (let attempt = 0; attempt < MAX_DISPATCH_ATTEMPTS; attempt++) {
        try {
          await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: webhookUrl,
            headers: {
              'Content-Type': 'application/json',
              [PARENT_RUN_ID_HEADER]: context.run.id,
              [FAIL_PARENT_ON_FAILURE_HEADER]: 'false',
            },
            body: { data: { batchIndex, headers, rows, extraData } },
          });
          return;
        } catch (error) {
          lastError = error;
          if (attempt < MAX_DISPATCH_ATTEMPTS - 1) {
            await sleep(Math.min(1000 * 2 ** attempt, 8000));
          }
        }
      }
      throw lastError;
    };

    try {
      return await fanOutBatches<CsvRow>({
        records: parser,
        batchSize,
        maxInFlight: MAX_IN_FLIGHT,
        dispatch,
      });
    } finally {
      parser.destroy();
      source.data.destroy();
    }
  },
});
