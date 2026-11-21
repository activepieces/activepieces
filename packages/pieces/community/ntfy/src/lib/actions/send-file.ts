import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyMessage } from '../common/client';
import { ntfyProps, TOPIC_DESCRIPTIONS } from '../common/props';
import { sentFileOutputSchema } from '../output-schemas';

export const sendFile = createAction({
  auth: ntfyAuth,
  name: 'send_file',
  classification: 'WRITE',
  displayName: 'Send File',
  description: 'Send a notification with a file from your flow attached.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads a file from the flow to the ntfy server and publishes it as a notification attachment, with an optional message, title, priority, tags and click URL. Agents attaching a file by URL should use Publish Message with an attachment URL instead. Not idempotent: each call uploads the file again and sends a new notification.',
    idempotent: false,
  },
  props: {
    topic: ntfyProps.topic({ description: TOPIC_DESCRIPTIONS.publish }),
    file: Property.File({
      displayName: 'File',
      description: 'Up to 2 MB on ntfy.sh, 15 MB on self-hosted servers by default.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: "Name shown for the file. Defaults to the file's own name.",
      placeholder: 'report.pdf',
      required: false,
    }),
    message: ntfyProps.optionalMessage('Empty: ntfy shows "You received a file: <file name>".'),
    title: ntfyProps.title(),
    priority: ntfyProps.priority(),
    tags: ntfyProps.tags(),
    click: ntfyProps.click(),
    delay: ntfyProps.delay(),
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Send to', icon: 'send', props: ['topic'] },
    { key: 'file', display: 'section', label: 'File', icon: 'file', props: ['file', 'filename'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['title', 'message'] },
    { key: 'appearance', display: 'section', label: 'Appearance', icon: 'sliders', props: ['priority', 'click', 'tags'] },
    { key: 'delivery', display: 'section', label: 'Delivery', icon: 'calendar', props: ['delay'] },
  ],
  outputSchema: sentFileOutputSchema,
  async run({ auth, propsValue }) {
    const topic = ntfyClient.validateId({ value: propsValue.topic, label: 'Topic' });
    const file = propsValue.file;
    const data = fileBytes(file);
    const filename = propsValue.filename?.trim() || file.filename || 'file';
    const priority = ntfyClient.parsePriority(propsValue.priority);
    const tags = ntfyClient.normalizeTags(propsValue.tags);
    const message = propsValue.message?.trim() ? propsValue.message : undefined;
    const title = propsValue.title?.trim() || undefined;
    const click = propsValue.click?.trim() || undefined;
    const delay = propsValue.delay?.trim() || undefined;
    const response = await ntfyClient.request<NtfyMessage>({
      auth,
      method: HttpMethod.PUT,
      path: `/${topic}`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': ntfyClient.encodeToRFC2047(filename),
        ...(message ? { 'X-Message': ntfyClient.encodeToRFC2047(message) } : {}),
        ...(title ? { 'X-Title': ntfyClient.encodeToRFC2047(title) } : {}),
        ...(priority !== undefined ? { 'X-Priority': String(priority) } : {}),
        ...(tags ? { 'X-Tags': ntfyClient.headerValue(tags.join(',')) } : {}),
        ...(click ? { 'X-Click': ntfyClient.headerValue(click) } : {}),
        ...(delay ? { 'X-Delay': ntfyClient.headerValue(delay) } : {}),
      },
      body: data,
    });
    return response.body;
  },
});

function fileBytes(file: { data?: unknown; base64?: unknown }): Buffer {
  if (Buffer.isBuffer(file.data)) {
    return file.data;
  }
  if (typeof file.base64 === 'string' && file.base64.length > 0) {
    return Buffer.from(file.base64, 'base64');
  }
  throw new Error('The File input is empty. Map a file from a previous step or upload one.');
}
