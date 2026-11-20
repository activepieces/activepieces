import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { META_MEDIA_TYPES, MediaFile, MetaMediaType, metaMediaBody, metaTemplateBody, metaTextBody } from '../common/payload';
import { syncmateProps } from '../common/props';

export const metaSendTextAction = createAction({
  auth: syncmateAuth,
  name: 'metaSendText',
  displayName: 'Meta: Send Text',
  description:
    'Send a text message from your Meta Cloud API number. Works only inside the 24-hour window after the customer last wrote; use a template otherwise.',
  props: {
    to: syncmateProps.phone('Recipient Phone Number'),
    text: Property.LongText({ displayName: 'Message', required: true }),
  },
  async run({ auth, propsValue }) {
    return syncmateRequest({
      auth,
      method: HttpMethod.POST,
      path: '/v1/meta/messages/text',
      body: metaTextBody(propsValue.to, propsValue.text),
    });
  },
});

export const metaSendTemplateAction = createAction({
  auth: syncmateAuth,
  name: 'metaSendTemplate',
  displayName: 'Meta: Send Template',
  description: 'Send an approved message template from your Meta Cloud API number. Works at any time.',
  props: {
    to: syncmateProps.phone('Recipient Phone Number'),
    template: syncmateProps.template,
    language: Property.ShortText({
      displayName: 'Language Code',
      description: 'The template language as approved by Meta, e.g. en, en_US, hi.',
      required: true,
      defaultValue: 'en',
    }),
    variables: Property.DynamicProperties({
      auth: syncmateAuth,
      displayName: 'Template Variables',
      description: 'Values for the template placeholders {{1}}, {{2}}, ...',
      required: false,
      refreshers: ['template'],
      props: async ({ auth, template }) => {
        if (!auth || !template) return {};
        let schema: { properties?: Record<string, unknown> };
        try {
          schema = await syncmateRequest({
            auth,
            method: HttpMethod.GET,
            path: '/v1/meta/messages/template-schema',
            queryParams: { template: String(template) },
          });
        } catch {
          return {};
        }
        const indexes = Object.keys(schema?.properties ?? {})
          .map((key) => Number(key.replace(/^var/, '')))
          .filter((n) => Number.isInteger(n) && n > 0)
          .sort((a, b) => a - b);

        return Object.fromEntries(
          indexes.map((n) => [
            String(n),
            Property.ShortText({ displayName: `Variable {{${n}}}`, required: true }),
          ])
        );
      },
    }),
    headerMediaType: Property.StaticDropdown({
      displayName: 'Header Media Type',
      description: 'Only for templates with an image, video or document header.',
      required: false,
      options: {
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Document', value: 'document' },
        ],
      },
    }),
    headerMediaUrl: Property.ShortText({
      displayName: 'Header Media URL',
      description: 'A public link to the header image, video or document. Or use Header File below.',
      required: false,
    }),
    headerFile: Property.File({
      displayName: 'Header File',
      description: 'The header image, video or document from an earlier step. Used instead of the URL when set (about 3.5 MB at most).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return syncmateRequest({
      auth,
      method: HttpMethod.POST,
      path: '/v1/meta/messages/template',
      body: metaTemplateBody({
        to: propsValue.to,
        templateName: propsValue.template,
        language: propsValue.language,
        variables: (propsValue.variables ?? {}) as Record<string, unknown>,
        headerMediaType: (propsValue.headerMediaType as 'image' | 'video' | 'document' | undefined) ?? null,
        headerMediaUrl: propsValue.headerMediaUrl,
        headerFile: toMediaFile(propsValue.headerFile),
      }),
    });
  },
});

export const metaSendMediaAction = createAction({
  auth: syncmateAuth,
  name: 'metaSendMedia',
  displayName: 'Meta: Send Media',
  description:
    'Send an image, video, audio file or document from your Meta Cloud API number, by public link. Works inside the 24-hour window.',
  props: {
    to: syncmateProps.phone('Recipient Phone Number'),
    mediaType: Property.StaticDropdown<MetaMediaType, true>({
      displayName: 'Media Type',
      required: true,
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Image (JPEG, PNG, max 5 MB)', value: 'image' },
          { label: 'Video (MP4, 3GPP, max 16 MB)', value: 'video' },
          { label: 'Audio (AAC, MP3, OGG, AMR, max 16 MB)', value: 'audio' },
          { label: 'Document (PDF, DOC, XLS, ..., max 100 MB)', value: 'document' },
        ],
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file from an earlier step (about 3.5 MB at most). Or use Media URL below.',
      required: false,
    }),
    mediaUrl: Property.ShortText({ displayName: 'Media URL', description: 'A public https link to the file. Used when no File is set.', required: false }),
    caption: Property.LongText({ displayName: 'Caption', description: 'Not shown for audio.', required: false }),
    fileName: Property.ShortText({ displayName: 'File Name', description: 'Documents only, e.g. invoice.pdf. Defaults to the file\'s own name.', required: false }),
  },
  async run({ auth, propsValue }) {
    return syncmateRequest({
      auth,
      method: HttpMethod.POST,
      path: '/v1/meta/messages/media',
      body: metaMediaBody({
        to: propsValue.to,
        mediaType: propsValue.mediaType,
        mediaUrl: propsValue.mediaUrl,
        file: toMediaFile(propsValue.file),
        caption: propsValue.caption,
        fileName: propsValue.fileName,
      }),
    });
  },
});

/** An Activepieces file prop as the base64 the Meta endpoints accept. */
function toMediaFile(file: ApFile | null | undefined): MediaFile | null {
  if (!file) return null;
  return { base64: file.base64, fileName: file.filename || `file${file.extension ? `.${file.extension}` : ''}` };
}

export const metaListTemplatesAction = createAction({
  auth: syncmateAuth,
  name: 'metaListTemplates',
  displayName: 'Meta: List Templates',
  description: 'List the message templates of your Meta Cloud API number with their approval status.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100.', required: false, defaultValue: 50 }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(100, Math.max(1, Math.trunc(Number(propsValue.limit ?? 50)) || 50));
    const queryParams: Record<string, string> = { limit: String(limit) };
    if (propsValue.status && propsValue.status !== 'all') {
      queryParams['status'] = String(propsValue.status);
    }
    return syncmateRequest({ auth, method: HttpMethod.GET, path: '/v1/meta/templates', queryParams });
  },
});

export { META_MEDIA_TYPES };
