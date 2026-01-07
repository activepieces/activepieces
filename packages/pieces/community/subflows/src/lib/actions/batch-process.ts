import { ActionContext, createAction, FlowsContext, PieceAuth, Property } from '@activepieces/pieces-framework';
import { CallableFlowRequest, findFlowByExternalIdOrThrow, FlowValue, listEnabledFlowsWithSubflowTrigger } from '../common';
import { ExecutionType, FAIL_PARENT_ON_FAILURE_HEADER, PARENT_RUN_ID_HEADER, PauseType, ProgressUpdateType } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type BatchItem = {
  id: string;
  status: 'processing' | 'completed' | 'error';
}

export const batchProcess = createAction({
  auth: PieceAuth.None(),
  name: 'batchProcess',
  displayName: 'Batch Process Data',
  description: 'Automatically process large batches of data using an executor flow',
  props: {
    data: Property.Array({
      displayName: 'Data',
      description: 'The data to process in batches',
      required: true,
      defaultValue: [],
      properties: {
        item: Property.Json({
          displayName: 'Payload',
          description:
            'Provide the data to be passed to the flow',
          required: true,
          defaultValue: {}, // Set as casted flow sample data when dynamic props are supported
        }),
      }
    }),
    executor_flow: Property.Dropdown<FlowValue>({
      auth: PieceAuth.None(),
      displayName: 'Flow',
      description: 'The flow to use for processing each item in the batch',
      required: true,
      options: async (_, context) => {
        const flows = await listEnabledFlowsWithSubflowTrigger({
          flowsContext: context.flows,
        });
        return {
          options: flows.map((flow) => ({
            value: {
              externalId: flow.externalId ?? flow.id,
              exampleData: flow.version.trigger.settings.input.exampleData,
            },
            label: flow.version.displayName,
          })),
        };
      },
      refreshers: [],
    }),
    batch_size: Property.Number({
      displayName: 'Batch Size',
      description:
        'The number of items to process in each batch (number between 1 and 100)',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { data, executor_flow, batch_size } = context.propsValue;
    const runId = context.run.id;

    if (!batch_size || batch_size < 1 || batch_size > 100) {
      throw new Error('Batch size must be between 1 and 100');
    }

    if (context.executionType === ExecutionType.RESUME) {
      const currentItem = context.resumePayload.queryParams['item_id'] as string;

      const batchNumber = await context.store.get<number>(`current_batch_number/${runId}`) ?? 0;
      const batchItems = await context.store.get<Array<BatchItem>>(`batch_items/${runId}/${batchNumber}`) ?? [] as Array<BatchItem>;

      // Mark the item as completed
      const item = batchItems.find((item) => item.id === currentItem);
      if (item) {
        item.status = 'completed';
        await context.store.put(`batch_items/${runId}/${batchNumber}`, batchItems);
      }

      let allCompleted = batchItems.every((item) => item.status === 'completed');
      while (!allCompleted) {
        // use flow pause if not all items are completed yet
        const currentTime = new Date();
        const futureTime = new Date(currentTime.getTime() + 2 * 60 * 1000);
        context.run.pause({
          pauseMetadata: {
            type: PauseType.DELAY,
            resumeDateTime: futureTime.toUTCString(),
          },
        });

        return;
      }

      if ((batchNumber + 1) * batch_size! >= data.length) {
        // All batches completed
        await context.store.delete(`current_batch_number/${runId}`);
        await context.store.delete(`batch_items/${runId}/${batchNumber}`);
        return { status: 'Batch processing completed' };
      }

      // Move to the next batch
      await context.store.put(`current_batch_number/${runId}`, batchNumber + 1);
      await context.store.delete(`batch_items/${runId}/${batchNumber}`);

      await startBatch(context);

      // use flow pause if not all items are completed yet
      const currentTime = new Date();
      const futureTime = new Date(currentTime.getTime() + 2 * 60 * 1000);
      context.run.pause({
        pauseMetadata: {
          type: PauseType.DELAY,
          resumeDateTime: futureTime.toUTCString(),
        },
      });

      return;
    }

    await startBatch(context)

    context.run.pause({
      pauseMetadata: {
        type: PauseType.WEBHOOK,
        response: {}
      }
    });

    return;
  },
});

async function startBatch(context: ActionContext): Promise<void> {
  const { data, executor_flow, batch_size } = context.propsValue;

  const flow = await findFlowByExternalIdOrThrow({
        flowsContext: context.flows,
        externalId: executor_flow?.externalId,
      });

  const runId = context.run.id;

  const batchNumber = await context.store.get<number>(`current_batch_number/${runId}`) ?? 0;

  const batchItems = data.slice(batchNumber * batch_size!, Math.min((batchNumber + 1) * batch_size!, data.length));

  // Loop over all items in the current batch
  for (const item of batchItems) {
    const itemId = nanoid();

    await httpClient.sendRequest<CallableFlowRequest>({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/webhooks/${flow?.id}`,
      headers: {
        'Content-Type': 'application/json',
        [PARENT_RUN_ID_HEADER]: context.run.id,
        [FAIL_PARENT_ON_FAILURE_HEADER]: 'false',
      },
      body: {
        data: item['item'],
        callbackUrl: context.generateResumeUrl({
          queryParams: {
            'item_id': itemId,
          }
        }),
      },
    });

    // Record item as processing and associate it with the current batch
    let batchItems = await context.store.get<Array<BatchItem>>(`batch_items/${runId}/${batchNumber}`) ?? [] as Array<BatchItem>;
    batchItems.push({
      id: itemId,
      status: 'processing',
    } as BatchItem);
    await context.store.put(`batch_items/${runId}/${batchNumber}`, batchItems);
  }

  return;
}
