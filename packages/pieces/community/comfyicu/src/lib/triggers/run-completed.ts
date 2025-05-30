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
      if (run.status === 'COMPLETED') {
        const runDetailsResponse = await comfyIcuApiCall({
          apiKey: auth,
          endpoint: `/workflows/${workflow_id}/runs/${run.id}`,
          method: HttpMethod.GET,
        });
        const runDetail = runDetailsResponse.body as { created_at: string };
        result.push(runDetail);
      }
      if (lastFetchEpochMS === 0 && result.length === 5) break;
    }

    return result.map((run) => {
      return {
        epochMilliSeconds: dayjs(run.created_at).valueOf(),
        data: run,
      };
    });
  },
};

export const runCompletedTrigger = createTrigger({
  auth: comfyIcuAuth,
  name: 'run-completed',
  displayName: 'Run Completed',
  description: 'Triggers when a workflow run is successfully completed.',
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
    id: 'CNCr5a_lu6g9Nz3gqKC9P',
    created_at: '2025-05-23T15:08:18.297Z',
    updated_at: '2025-05-23T15:08:27.476Z',
    deleted_at: null,
    started_at: '2025-05-23T15:08:19.760Z',
    completed_at: '2025-05-23T15:08:27.384Z',
    run_time: 6357,
    status: 'COMPLETED',
    kind: 'comfyui',
    data: {
      prompt: {
        '3': {
          _meta: {
            title: 'KSampler',
          },
          inputs: {
            cfg: 8,
            seed: 253353381004563,
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
          class_type: 'CLIPTextEncode',
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
      extra_data: {
        extra_pnginfo: {
          workflow: {
            extra: {
              ds: {
                scale: 0.45,
                offset: [],
              },
              ue_links: [],
              VHS_MetadataImage: true,
              VHS_latentpreview: false,
              VHS_KeepIntermediate: true,
              VHS_latentpreviewrate: 0,
            },
            links: [
              [1, 4, 0, 3, 0, 'MODEL'],
              [2, 5, 0, 3, 3, 'LATENT'],
              [3, 4, 1, 6, 0, 'CLIP'],
              [4, 6, 0, 3, 1, 'CONDITIONING'],
              [5, 4, 1, 7, 0, 'CLIP'],
              [6, 7, 0, 3, 2, 'CONDITIONING'],
              [7, 3, 0, 8, 0, 'LATENT'],
              [8, 4, 2, 8, 1, 'VAE'],
              [9, 8, 0, 9, 0, 'IMAGE'],
            ],
            nodes: [
              {
                id: 7,
                pos: [413, 389],
                mode: 0,
                size: [],
                type: 'CLIPTextEncode',
                flags: {},
                order: 3,
                inputs: [
                  {
                    link: 5,
                    name: 'clip',
                    type: 'CLIP',
                  },
                ],
                outputs: [
                  {
                    name: 'CONDITIONING',
                    type: 'CONDITIONING',
                    links: [6],
                    slot_index: 0,
                  },
                ],
                properties: {
                  'Node name for S&R': 'CLIPTextEncode',
                },
                widgets_values: ['text, watermark'],
              },
              {
                id: 5,
                pos: [473, 609],
                mode: 0,
                size: [315, 106],
                type: 'EmptyLatentImage',
                flags: {},
                order: 0,
                inputs: [],
                outputs: [
                  {
                    name: 'LATENT',
                    type: 'LATENT',
                    links: [2],
                    slot_index: 0,
                  },
                ],
                properties: {
                  'Node name for S&R': 'EmptyLatentImage',
                },
                widgets_values: [512, 512, 1],
              },
              {
                id: 8,
                pos: [1209, 188],
                mode: 0,
                size: [210, 46],
                type: 'VAEDecode',
                flags: {},
                order: 5,
                inputs: [
                  {
                    link: 7,
                    name: 'samples',
                    type: 'LATENT',
                  },
                  {
                    link: 8,
                    name: 'vae',
                    type: 'VAE',
                  },
                ],
                outputs: [
                  {
                    name: 'IMAGE',
                    type: 'IMAGE',
                    links: [9],
                    slot_index: 0,
                  },
                ],
                properties: {
                  'Node name for S&R': 'VAEDecode',
                },
                widgets_values: [],
              },
              {
                id: 9,
                pos: [1451, 189],
                mode: 0,
                size: [210, 270],
                type: 'SaveImage',
                flags: {},
                order: 6,
                inputs: [
                  {
                    link: 9,
                    name: 'images',
                    type: 'IMAGE',
                  },
                ],
                outputs: [],
                properties: {
                  'Node name for S&R': 'SaveImage',
                },
                widgets_values: ['ComfyUI'],
              },
              {
                id: 3,
                pos: [],
                mode: 0,
                size: [315, 262],
                type: 'KSampler',
                flags: {},
                order: 4,
                inputs: [
                  {
                    link: 1,
                    name: 'model',
                    type: 'MODEL',
                  },
                  {
                    link: 4,
                    name: 'positive',
                    type: 'CONDITIONING',
                  },
                  {
                    link: 6,
                    name: 'negative',
                    type: 'CONDITIONING',
                  },
                  {
                    link: 2,
                    name: 'latent_image',
                    type: 'LATENT',
                  },
                ],
                outputs: [
                  {
                    name: 'LATENT',
                    type: 'LATENT',
                    links: [7],
                    slot_index: 0,
                  },
                ],
                properties: {
                  'Node name for S&R': 'KSampler',
                },
                widgets_values: [
                  253353381004563,
                  'randomize',
                  20,
                  8,
                  'euler',
                  'normal',
                  1,
                ],
              },
              {
                id: 4,
                pos: [],
                mode: 0,
                size: [315, 310],
                type: 'CheckpointLoaderSimple',
                flags: {},
                order: 1,
                inputs: [],
                outputs: [
                  {
                    name: 'MODEL',
                    type: 'MODEL',
                    links: [1],
                    slot_index: 0,
                  },
                  {
                    name: 'CLIP',
                    type: 'CLIP',
                    links: [3, 5],
                    slot_index: 1,
                  },
                  {
                    name: 'VAE',
                    type: 'VAE',
                    links: [8],
                    slot_index: 2,
                  },
                ],
                properties: {
                  'Node name for S&R': 'CheckpointLoaderSimple',
                },
                widgets_values: ['v1-5-pruned-emaonly-fp16.safetensors'],
              },
              {
                id: 6,
                pos: [415, 186],
                mode: 0,
                size: [422.8450317382812, 164.3130493164062],
                type: 'CLIPTextEncode',
                flags: {},
                order: 2,
                inputs: [
                  {
                    link: 3,
                    name: 'clip',
                    type: 'CLIP',
                  },
                ],
                outputs: [
                  {
                    name: 'CONDITIONING',
                    type: 'CONDITIONING',
                    links: [4],
                    slot_index: 0,
                  },
                ],
                properties: {
                  'Node name for S&R': 'CLIPTextEncode',
                },
                widgets_values: [
                  'beautiful scenery nature glass bottle landscape, , purple galaxy bottle,',
                ],
              },
            ],
            config: {},
            groups: [],
            version: 0.4,
            last_link_id: 9,
            last_node_id: 9,
          },
        },
      },
      accelerator: 'L4',
    },
    workflow: null,
    workflow_api: null,
    workflow_id: 'xyz',
    output: [
      {
        filename:
          '/workflows/xyz/output/xyz/ComfyUI_00001_.png',
        url: 'https://r2.comfy.icu/workflows/xyz/output/CNCr5a_lu6g9Nz3gqKC9P/ComfyUI_00001_.png',
        thumbnail_url:
          'https://img.comfy.icu/sig/width:300/quality:85/xyz',
      },
    ],
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
    api_key_id: null,
    retry_count: 1,
    client_agent: null,
    webhook: null,
    project_id: 12297,
    user: {
      id: '6VbYatQkJjualbDX84D2j',
      name: 'John Doe',
      image: '',
      plan: 'FREE',
    },
    metadata: {
      extensions: ['comfyanonymous__ComfyUI'],
      nodes: [
        'CLIPTextEncode',
        'EmptyLatentImage',
        'VAEDecode',
        'SaveImage',
        'KSampler',
        'CheckpointLoaderSimple',
      ],
      checkpoints: ['v1-5-pruned-emaonly-fp16.safetensors'],
      notes: [
        {
          text: 'text, watermark',
        },
        {
          text: 'beautiful scenery nature glass bottle landscape, , purple galaxy bottle,',
        },
      ],
      groups: [],
    },
  },
});
