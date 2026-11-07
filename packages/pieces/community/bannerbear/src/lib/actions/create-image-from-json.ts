import { createAction, Property } from '@activepieces/pieces-framework';
import { bannerbearAuth } from '../auth';
import { bannerbearClient } from '../common/client';
import { bannerbearProps } from '../common/props';
import { bannerbearOutputSchemas } from '../output-schemas';

export const createImageFromJsonAction = createAction({
  auth: bannerbearAuth,
  name: 'create_image_from_json',
  classification: 'WRITE',
  displayName: 'Create Image from JSON',
  description: 'Render an image from a template ID and layer changes as JSON.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Render an image from a Bannerbear template ID and a JSON array of layer modifications. Call Get Template first to learn the layer names. Each call starts a new render and uses a credit, so retries create duplicates.',
    idempotent: false,
  },
  outputSchema: bannerbearOutputSchemas['createImage'],
  props: {
    template_uid: Property.ShortText({
      displayName: 'Template ID',
      description: 'The template UID, from List Templates.',
      required: true,
    }),
    modifications: Property.Json({
      displayName: 'Layer Modifications',
      description: 'JSON array, one object per layer, each with "name".',
      required: true,
      defaultValue: [{ name: 'title', text: 'Hello world' }],
    }),
    transparent: Property.Checkbox({
      displayName: 'Transparent Background',
      description: 'Render a PNG with a transparent background.',
      required: false,
    }),
    render_pdf: Property.Checkbox({
      displayName: 'Render a PDF',
      description: 'Also render a PDF (uses extra credits).',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Any text to store with the image, e.g. a record ID.',
      required: false,
    }),
    wait_for_completion: bannerbearProps.waitForCompletion,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const templateUid = propsValue.template_uid.trim();
    if (templateUid === '') {
      throw new Error('Template ID is required.');
    }
    const modifications = bannerbearClient.parseModificationsJson(
      propsValue.modifications
    );
    const body = bannerbearClient.buildImageRequest({
      apiKey,
      templateUid,
      modifications,
      transparent: propsValue.transparent,
      renderPdf: propsValue.render_pdf,
      metadata: propsValue.metadata,
    });
    return bannerbearClient.createImageAndWait({
      apiKey,
      body,
      wait: propsValue.wait_for_completion !== false,
    });
  },
});
