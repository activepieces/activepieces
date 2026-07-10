import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  FAIL_PARENT_ON_FAILURE_HEADER,
  FlowStatus,
  PARENT_RUN_ID_HEADER,
} from '@activepieces/pieces-framework';
import { parse } from 'csv-parse/sync';
import {
  findFlowByExternalIdOrThrow,
  listFlowsWithSubflowTrigger,
} from '../common';

type FlowValue = {
  externalId: string;
};

export const processCsvInChunks = createAction({
  audience: 'human',
  name: 'processCsvInChunks',
  displayName: 'Process CSV in Chunks',
  description:
    'Split a CSV file into chunks and dispatch each chunk to a subflow ("Callable Flow") for processing. Set the chunk size below; when left empty it defaults to 5000 rows.',
  props: {
    file: Property.File({
      displayName: 'CSV File',
      description: 'The CSV file to split and process.',
      required: true,
    }),
    flow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description:
        'The subflow that processes each chunk. Only published flows with a "Callable Flow" trigger appear here; disabled flows are marked "(inactive)".',
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
    chunkSize: Property.Number({
      displayName: 'Chunk Size (rows)',
      description: 'Number of rows per chunk. Defaults to 5000 when left empty.',
      required: false,
    }),
    hasHeaders: Property.Checkbox({
      displayName: 'Does the CSV have headers?',
      required: true,
      defaultValue: true,
    }),
    delimiter: Property.StaticDropdown({
      displayName: 'Delimiter',
      description: 'The delimiter used in the CSV file.',
      required: true,
      defaultValue: ',',
      options: {
        options: [
          { label: 'Comma', value: ',' },
          { label: 'Tab', value: '\t' },
          { label: 'Semicolon', value: ';' },
        ],
      },
    }),
    additionalData: Property.Object({
      displayName: 'Additional Data',
      description: 'Static data merged into every chunk payload sent to the subflow.',
      required: false,
    }),
  },
  async run(context) {
    const file = context.propsValue.file;
    const rows = parse(file.data.toString('utf-8'), {
      delimiter: context.propsValue.delimiter,
      columns: context.propsValue.hasHeaders,
      skip_empty_lines: true,
    }) as unknown[];

    const chunkSize = resolveChunkSize(context.propsValue.chunkSize);
    const chunks = chunkArray(rows, chunkSize);

    const flow = await findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.flow?.externalId,
    });
    if (flow.status !== FlowStatus.ENABLED) {
      throw new Error(
        JSON.stringify({
          message:
            'The selected subflow is disabled. Enable it before processing chunks.',
          externalId: context.propsValue.flow?.externalId,
          flowName: flow.version.displayName,
        })
      );
    }

    const additionalData = context.propsValue.additionalData ?? {};
    const url = `${context.server.apiUrl}v1/webhooks/${flow.id}`;

    for (let index = 0; index < chunks.length; index++) {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url,
        headers: {
          'Content-Type': 'application/json',
          [PARENT_RUN_ID_HEADER]: context.run.id,
          [FAIL_PARENT_ON_FAILURE_HEADER]: 'false',
        },
        body: {
          data: {
            chunkIndex: index,
            totalChunks: chunks.length,
            rows: chunks[index],
            ...additionalData,
          },
        },
      });
    }

    return {
      dispatchedChunks: chunks.length,
      chunkSize,
      totalRows: rows.length,
      flowExternalId: flow.externalId ?? flow.id,
    };
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
      hide: false,
    },
    retryOnFailure: {
      defaultValue: false,
      hide: false,
    },
  },
});

function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function resolveChunkSize(chunkSize: number | undefined): number {
  if (typeof chunkSize === 'number' && Number.isFinite(chunkSize) && chunkSize >= 1) {
    return Math.floor(chunkSize);
  }
  return DEFAULT_CHUNK_SIZE;
}

const DEFAULT_CHUNK_SIZE = 5000;
