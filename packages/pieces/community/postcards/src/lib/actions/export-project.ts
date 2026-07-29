import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const exportProject = createAction({
  auth: postcardsAuth,
  name: 'export_project',
  displayName: 'Export Project',
  description:
    'Export a project to HTML or ZIP. With Image Hosting off, returns a ZIP (base64) bundling index.html + assets. With Image Hosting on, returns hosted HTML as JSON or raw HTML. Counts against the monthly export quota.',
  props: {
    id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Numeric id or obfuscated_id.',
      required: true,
    }),
    imageHosting: Property.Checkbox({
      displayName: 'Image Hosting',
      description:
        'Upload assets to Postcards hosting and reference them by URL. If off, assets are bundled into a ZIP.',
      required: false,
      defaultValue: false,
    }),
    cdn: Property.Checkbox({
      displayName: 'Use CDN',
      description: 'Serve assets from the Postcards CDN. Requires Image Hosting and the Pro plan.',
      required: false,
      defaultValue: false,
    }),
    minify: Property.Checkbox({
      displayName: 'Minify HTML',
      required: false,
      defaultValue: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Response shape when Image Hosting is on (ignored for ZIP).',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON ({ "html": "..." })', value: 'json' },
          { label: 'Raw HTML', value: 'html' },
        ],
      },
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description:
        'Map of {{key}} placeholder substitutions. Values must be scalar (string, number, boolean).',
      required: false,
    }),
  },
  async run(context) {
    const { id, imageHosting, cdn, minify, format, variables } = context.propsValue;
    const isZip = !imageHosting;

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${POSTCARDS_BASE_URL}/api/v1/projects/${id}/export`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        imageHosting: imageHosting ?? false,
        cdn: cdn ?? false,
        minify: minify ?? false,
        format: format ?? 'json',
        variables: variables ?? {},
      },
      responseType: isZip ? 'arraybuffer' : 'json',
    });

    if (isZip) {
      return {
        format: 'zip',
        zip_base64: Buffer.from(res.body as ArrayBuffer).toString('base64'),
      };
    }
    return res.body;
  },
});
