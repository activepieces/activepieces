import { comfyIcuAuth } from '../../index';
import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { comfyIcuApiCall, commonProps } from '../common';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof comfyIcuAuth>,
  { workflow_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { workflow_id } = propsValue;
    const listRunsResponse = await comfyIcuApiCall({
      apiKey: auth,
      endpoint: `/workflows/${workflow_id}/runs`,
      method: HttpMethod.GET,
    });

    const runs = listRunsResponse.body as {
      id: string;
      status: string;
      created_at: string;
    }[];

    const result = [];

    for (const run of runs) {
      if (run.status === 'ERROR') {
        const runDetailsResponse = await comfyIcuApiCall({
          apiKey: auth,
          endpoint: `/workflows/${workflow_id}/runs/${run.id}`,
          method: HttpMethod.GET,
        });
        const runDetail = runDetailsResponse.body as { created_at: string };
        result.push(runDetail);

        if (lastFetchEpochMS === 0 && result.length === 5) break;
      }
    }

    return result.map((run) => {
      return {
        epochMilliSeconds: dayjs(run.created_at).valueOf(),
        data: run,
      };
    });
  },
};

export const runFailedTrigger = createTrigger({
  auth: comfyIcuAuth,
  name: 'run-failed',
  displayName: 'Run Failed',
  description: 'Triggers when a workflow run is failed.',
  props: {
    workflow_id: commonProps.workflow_id,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'sve-GBc89WPLPncm4laYG',
    created_at: '2025-05-23T15:09:44.273Z',
    updated_at: '2025-05-23T15:09:48.128Z',
    deleted_at: null,
    started_at: '2025-05-23T15:09:45.700Z',
    completed_at: '2025-05-23T15:09:47.997Z',
    run_time: 3,
    status: 'ERROR',
    kind: 'comfyui',
    data: {
      prompt: {
        '3': {
          _meta: {
            title: 'KSampler',
          },
          inputs: {
            cfg: 8,
            seed: 156680208700286,
            model: ['4', 0],
            steps: 20,
            denoise: 1,
            negative: ['7', 0],
            positive: ['6', 0],
            scheduler: 'normal',
            latent_image: ['5', 0],
            sampler_name: 'euler',
          },
          class_type: 'KSampler',
        },
        '4': {
          _meta: {
            title: 'Load Checkpoint',
          },
          inputs: {
            ckpt_name: 'v1-5-pruned-emaonly-fp16.safetensors',
          },
          class_type: 'CheckpointLoaderSimple',
        },
        '5': {
          _meta: {
            title: 'Empty Latent Image',
          },
          inputs: {
            width: 512,
            height: 512,
            batch_size: 1,
          },
          class_type: 'EmptyLatentImage',
        },
        '6': {
          _meta: {
            title: 'CLIP Text Encode (Prompt)',
          },
          inputs: {
            clip: ['4', 1],
            text: 'beautiful scenery nature glass bottle landscape, , purple galaxy bottle,',
          },
          class_type: 'CLIPTextEncode',
        },
        '7': {
          _meta: {
            title: 'CLIP Text Encode (Prompt)',
          },
          inputs: {
            clip: ['4', 1],
            text: 'text, watermark',
          },
          class_type: 'xx',
        },
        '8': {
          _meta: {
            title: 'VAE Decode',
          },
          inputs: {
            vae: ['4', 2],
            samples: ['3', 0],
          },
          class_type: 'VAEDecode',
        },
        '9': {
          _meta: {
            title: 'Save Image',
          },
          inputs: {
            images: ['8', 0],
            filename_prefix: 'ComfyUI',
          },
          class_type: 'SaveImage',
        },
      },
      webhook: '',
    },
    workflow: null,
    workflow_api: null,
    workflow_id: '46AnCzsekAoAXLZqVQUXH',
    output: {
      error: {
        details: {
          error: {
            type: 'invalid_prompt',
            details: "Node ID '#7'",
            message: 'Cannot execute because node xx does not exist.',
            extra_info: {},
          },
          node_errors: {},
        },
        prompt_id: 'sve-GBc89WPLPncm4laYG',
        traceback: [
          '  File "/app/headless.py", line 771, in run_workflow\n    prompt_id = self.queue_prompt(wf["prompt"])\n',
          '  File "/app/headless.py", line 421, in queue_prompt\n    raise RuntimeError(output)\n',
        ],
        exception_type: 'invalid_prompt',
        exception_message:
          "Cannot execute because node xx does not exist.: Node ID '#7'",
      },
      output: {
        error: {
          details: {
            error: {
              type: 'invalid_prompt',
              details: "Node ID '#7'",
              message: 'Cannot execute because node xx does not exist.',
              extra_info: {},
            },
            node_errors: {},
          },
          prompt_id: 'sve-GBc89WPLPncm4laYG',
          traceback: [
            '  File "/app/headless.py", line 771, in run_workflow\n    prompt_id = self.queue_prompt(wf["prompt"])\n',
            '  File "/app/headless.py", line 421, in queue_prompt\n    raise RuntimeError(output)\n',
          ],
          exception_type: 'invalid_prompt',
          exception_message:
            "Cannot execute because node xx does not exist.: Node ID '#7'",
        },
      },
    },
    error: null,
    files: {},
    name: null,
    tags: [],
    view_count: 0,
    download_count: 0,
    is_nsfw: false,
    user_id: '6VbYatQkJjualbDX84D2j',
    device: 'NVIDIA L4',
    accelerator: 'L4',
    visibility: 'PUBLIC',
    parent_workflow_id: null,
    parent_run_id: null,
    api_key_id: 'GM2FYwGmgiNpXTNDqT6MT',
    retry_count: 1,
    client_agent: null,
    webhook: '',
    project_id: 12297,
    user: null,
  },
});
