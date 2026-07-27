import { ExecutionType, Property, createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { DEFAULT_MAX_WAIT_SECONDS, VIDEO_FORMATS } from '../common/constants';
import { toFlatFields } from '../common/flat-fields';
import {
  dynamicFieldsProp,
  maxWaitSecondsProp,
  metadataProp,
  templateIdProp,
  textOverflowProp,
  waitForCompletionProp,
} from '../common/props';
import { executeRender, readResumedRender } from '../common/render';
import type { FieldDef } from '../common/types';

export const renderVideo = createAction({
  auth: polotnoStudioAuth,
  name: 'render_video',
  displayName: 'Render Video',
  description: 'Render a video from a Polotno Studio template.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders a video (MP4 or GIF) from a Polotno Studio template, filling the template dynamic fields with the supplied values. Choose this to produce a finished video asset from a template. Requires a template id. Video rendering is always asynchronous; by default the flow waits until it finishes and returns the completed render with its URL. Costs one credit per second of output. Not idempotent — each call with a new flow run starts a new render.',
    idempotent: false,
  },
  props: {
    template_id: templateIdProp,
    dynamic_fields: dynamicFieldsProp,
    format: Property.StaticDropdown<string>({
      displayName: 'Format',
      required: false,
      defaultValue: 'mp4',
      options: { options: VIDEO_FORMATS.map((f) => ({ label: f.toUpperCase(), value: f })) },
    }),
    fps: Property.Number({
      displayName: 'Frames Per Second',
      description: '1 to 120.',
      required: false,
    }),
    duration_seconds: Property.Number({
      displayName: 'Duration (seconds)',
      description: '1 to 600. Each second costs one credit.',
      required: false,
    }),
    text_overflow: textOverflowProp,
    metadata: metadataProp,
    wait_for_completion: waitForCompletionProp,
    max_wait_seconds: maxWaitSecondsProp,
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      return readResumedRender(context.resumePayload);
    }

    const client = createClient(context.auth.secret_text);
    const props = context.propsValue;

    const fields = await client.request<{ fields: FieldDef[] }>({
      path: `/v1/templates/${encodeURIComponent(props.template_id)}/dynamic-fields`,
    });
    const dynamicFieldsFlat = toFlatFields(fields.fields ?? [], props.dynamic_fields ?? {});

    const body: Record<string, unknown> = { template_id: props.template_id };
    if (Object.keys(dynamicFieldsFlat).length > 0) body['dynamic_fields_flat'] = dynamicFieldsFlat;
    if (props.format) body['format'] = props.format;
    if (props.fps) body['fps'] = props.fps;
    if (props.duration_seconds) body['duration_seconds'] = props.duration_seconds;
    if (props.text_overflow) body['text_overflow'] = props.text_overflow;
    if (props.metadata && Object.keys(props.metadata).length > 0) body['metadata'] = props.metadata;

    return executeRender({
      client,
      kind: 'videos',
      body,
      idempotencyKey: `${context.run.id}:${context.step.name}`,
      waitForCompletion: props.wait_for_completion !== false,
      maxWaitSeconds: props.max_wait_seconds ?? DEFAULT_MAX_WAIT_SECONDS,
      // Wrapped, not passed by reference: these are engine-provided hooks and
      // must keep their `this`.
      createWaitpoint: (waitpointParams) => context.run.createWaitpoint(waitpointParams),
      waitForWaitpoint: (waitpointId) => context.run.waitForWaitpoint(waitpointId),
    });
  },
});
