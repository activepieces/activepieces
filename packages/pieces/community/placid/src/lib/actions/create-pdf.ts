import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
  pdfTemplateDropdown,
  layersProperty,
  modificationsProperty,
  webhookProperty,
  createNowProperty,
  passthroughProperty,
} from '../common/props';

export const createPdf = createAction({
  auth: placidAuth,
  name: 'create_pdf',
  displayName: 'Create PDF',
  description: 'Generate a PDF document from a specified template',
  props: {
    template: pdfTemplateDropdown,
    layers: layersProperty,
    modifications: modificationsProperty,
    webhook_success: webhookProperty,
    create_now: createNowProperty,
    passthrough: passthroughProperty,
  },
  async run(context) {
    const {
      template,
      layers,
      modifications,
      webhook_success,
      create_now,
      passthrough,
    } = context.propsValue;

    const client = new PlacidClient(context.auth);

    // PDFs require a pages array structure
    const request = {
      pages: [
        {
          template_uuid: template,
          ...(layers && { layers }),
        },
      ],
      ...(modifications && { modifications }),
      ...(webhook_success && { webhook_success }),
      ...(create_now !== undefined && { create_now }),
      ...(passthrough && { passthrough }),
    };

    return await client.createPdf(request);
  },
});