import {
  createAction,
  ExecutionType,
  FAIL_PARENT_ON_FAILURE_HEADER,
  FlowStatus,
  PARENT_RUN_ID_HEADER,
  PieceAuth,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Readable } from 'node:stream';
import axios from 'axios';
import { parse } from 'csv-parse';
import { findFlowByExternalIdOrThrow, listFlowsWithSubflowTrigger } from '../common';
import { fanOutBatches } from '../fan-out';
import { evaluateFanIn, FanInRollup, FanInState } from '../fan-in';

type FlowValue = {
  externalId: string;
};

type CsvRow = Record<string, string>;

type StoredFanIn = FanInState & {
  headers: string[];
  firstRow?: CsvRow;
};

const MAX_IN_FLIGHT = 5;
const POLL_INTERVAL_SECONDS = 30;

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
    subflow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Subflow',
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
    waitForAllSubflows: Property.Checkbox({
      displayName: 'Wait for all subflows to finish',
      description:
        'Pause this step until every dispatched subflow run is finished, then continue with a summary. A failed subflow is reported, not thrown.',
      required: false,
      defaultValue: false,
    }),
    maxWaitMinutes: Property.Number({
      displayName: 'Max wait (minutes)',
      description:
        'Stop waiting after this many minutes and continue with a timed-out summary. Only used when waiting is enabled.',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    const { fileUrl, batchSize, delimiter, extraData, waitForAllSubflows } =
      context.propsValue;
    const maxWaitMinutes = context.propsValue.maxWaitMinutes ?? 60;

    const storeKey = `fanin:${context.run.id}:${context.step.name}`;
    const apiBase = context.server.apiUrl.replace(/\/$/, '');
    const rollupUrl = `${apiBase}/v1/engine/flow-runs/count-by-parent`;

    const fetchRollup = async (): Promise<FanInRollup> => {
      const response = await httpClient.sendRequest<FanInRollup>({
        method: HttpMethod.GET,
        url: rollupUrl,
        queryParams: { parentRunId: context.run.id },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.server.token,
        },
      });
      return response.body;
    };

    const check = async () => {
      const state = await context.store.get<StoredFanIn>(storeKey, StoreScope.FLOW);
      if (state === null) {
        throw new Error(
          JSON.stringify({
            message:
              'Resumed to wait for subflows but the fan-in state is missing. The stored progress was lost, so completion can no longer be tracked.',
          })
        );
      }
      const cur = await fetchRollup();
      const verdict = evaluateFanIn({ cur, state, nowMs: Date.now() });
      if (verdict.done || verdict.timedOut) {
        await context.store.delete(storeKey, StoreScope.FLOW);
        return {
          batchesDispatched: state.batchesDispatched,
          succeeded: verdict.succeeded,
          failed: verdict.failed,
          stillRunning: verdict.stillRunning,
          timedOut: verdict.timedOut,
          headers: state.headers,
          firstRow: state.firstRow,
        };
      }
      const waitpoint = await context.run.createWaitpoint({
        type: 'DELAY',
        resumeDateTime: new Date(
          Date.now() + POLL_INTERVAL_SECONDS * 1000
        ).toUTCString(),
      });
      context.run.waitForWaitpoint(waitpoint.id);
      return {};
    };

    if (context.executionType === ExecutionType.RESUME) {
      const resumeState = await context.store.get<StoredFanIn>(storeKey, StoreScope.FLOW);
      if (resumeState !== null) {
        return check();
      }
    }

    if (!Number.isInteger(batchSize) || batchSize < 1) {
      throw new Error(
        JSON.stringify({ message: 'Rows per batch must be a positive integer.' })
      );
    }
    if (waitForAllSubflows && (!Number.isInteger(maxWaitMinutes) || maxWaitMinutes < 1)) {
      throw new Error(
        JSON.stringify({ message: 'Max wait minutes must be a positive integer.' })
      );
    }

    const flow = await findFlowByExternalIdOrThrow({
      flowsContext: context.flows,
      externalId: context.propsValue.subflow?.externalId,
    });
    if (flow.status !== FlowStatus.ENABLED) {
      throw new Error(
        JSON.stringify({
          message:
            'The selected subflow is disabled. Enable it before streaming to it.',
          externalId: context.propsValue.subflow?.externalId,
          flowName: flow.version.displayName,
        })
      );
    }
    const webhookUrl = `${apiBase}/v1/webhooks/${flow.id}`;

    const baseline = waitForAllSubflows ? await fetchRollup() : null;
    if (baseline !== null && baseline.nonTerminal > 0) {
      throw new Error(
        JSON.stringify({
          message:
            'This flow run already has subflows in progress. Do not combine "Wait for all subflows to finish" with fire-and-forget subflow steps in the same run.',
        })
      );
    }

    const source = await axios.get<Readable>(fileUrl, {
      responseType: 'stream',
    });

    let headers: string[] = [];
    let firstRow: CsvRow | undefined;
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
      if (batchIndex === 0) {
        firstRow = rows[0];
      }
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
    };

    try {
      const result = await fanOutBatches<CsvRow>({
        records: parser,
        batchSize,
        maxInFlight: MAX_IN_FLIGHT,
        dispatch,
      });
      if (!waitForAllSubflows || baseline === null) {
        return { headers, firstRow, ...result };
      }
      await context.store.put<StoredFanIn>(
        storeKey,
        {
          batchesDispatched: result.batchesDispatched,
          baselineSucceeded: baseline.succeeded,
          baselineFailed: baseline.failed,
          deadline: Date.now() + maxWaitMinutes * 60_000,
          headers,
          firstRow,
        },
        StoreScope.FLOW
      );
      return check();
    } finally {
      parser.destroy();
      source.data.destroy();
    }
  },
});
