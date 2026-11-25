import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient } from '../common/client';
import { bannerbearProps } from '../common/props';
import { bannerbearOutputSchemas } from '../output-schemas';

export const createAnimatedGifAction = createAction({
  auth: bannerbearAuth,
  name: 'create_animated_gif',
  classification: 'WRITE',
  displayName: 'Create Animated GIF',
  description: 'Render an animated GIF from frames (V2 API keys only).',
  audience: 'both',
  aiMetadata: {
    description:
      'Render an animated GIF from a Bannerbear template where each frame is its own list of layer modifications. Only works with V2 API keys. Each call starts a new render and uses credits.',
    idempotent: false,
  },
  outputSchema: bannerbearOutputSchemas['animatedGif'],
  props: {
    template_uid: Property.ShortText({
      displayName: 'Template ID',
      description: 'The template UID, from List Templates.',
      required: true,
    }),
    frames: Property.Json({
      displayName: 'Frames',
      description: 'JSON array of frames; each frame is an array of layers.',
      required: true,
      defaultValue: [[{ name: 'title', text: 'Frame 1' }], [{ name: 'title', text: 'Frame 2' }]],
    }),
    fps: Property.Number({
      displayName: 'Frames per Second',
      description: 'Playback speed, e.g. 1.',
      required: false,
    }),
    loop: Property.Checkbox({
      displayName: 'Loop',
      description: 'Loop the GIF forever.',
      required: false,
      defaultValue: true,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Any text to store with the GIF.',
      required: false,
    }),
    wait_for_completion: bannerbearProps.waitForCompletion,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    bannerbearClient.requireVersion({ apiKey, version: 'v2', feature: 'Create Animated GIF' });
    const template = propsValue.template_uid.trim();
    if (template === '') throw new Error('Template ID is required.');
    const rawFrames = parseFrames(propsValue.frames);
    if (!Array.isArray(rawFrames) || rawFrames.length === 0) {
      throw new Error('Frames must be a non-empty JSON array of frames.');
    }
    const frames = rawFrames.map((frame) => bannerbearClient.parseModificationsJson(frame));
    const body: Record<string, unknown> = { template, frames };
    if (propsValue.fps !== undefined && propsValue.fps !== null) {
      const fps = Number(propsValue.fps);
      if (!Number.isFinite(fps) || fps <= 0) {
        throw new Error('Frames per Second must be a positive number.');
      }
      body['fps'] = fps;
    }
    if (propsValue.loop !== undefined) body['loop'] = propsValue.loop;
    if (propsValue.metadata) body['metadata'] = propsValue.metadata;
    const created = await bannerbearClient.request<RawGif>({
      apiKey,
      method: HttpMethod.POST,
      path: '/animated_gifs',
      body,
    });
    const { record, timedOut } = await bannerbearClient.waitFor({
      initial: created,
      wait: propsValue.wait_for_completion !== false,
      doneStatuses: bannerbearClient.IMAGE_DONE_STATUSES,
      failedStatuses: bannerbearClient.IMAGE_FAILED_STATUSES,
      fetchLatest: () =>
        bannerbearClient.request<RawGif>({
          apiKey,
          method: HttpMethod.GET,
          path: `/animated_gifs/${encodeURIComponent(created.uid)}`,
        }),
    });
    bannerbearClient.throwIfFailed({ status: record.status, uid: record.uid });
    return {
      uid: record.uid,
      status: record.status ?? null,
      template_uid: bannerbearClient.readTemplateUid(record.template) ?? template,
      image_url: record.image_url ?? null,
      fps: record.fps ?? null,
      metadata: record.metadata ?? null,
      self: record.self ?? null,
      created_at: record.created_at ?? null,
      timed_out: timedOut,
    };
  },
});

function parseFrames(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Frames is not valid JSON.');
  }
}

type RawGif = {
  uid: string;
  status?: string | null;
  template?: unknown;
  image_url?: string | null;
  fps?: number | null;
  metadata?: string | null;
  self?: string | null;
  created_at?: string | null;
};
