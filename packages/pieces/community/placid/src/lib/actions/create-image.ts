import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
  imageTemplateDropdown,
  layersProperty,
  modificationsProperty,
  webhookProperty,
  createNowProperty,
  passthroughProperty,
} from '../common/props';

export const createImage = createAction({
  auth: placidAuth,
  name: 'create_image',
  displayName: 'Create Image',
  description: 'Generate a dynamic image from a specified template using input data',
  props: {
    template: imageTemplateDropdown,
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

    const request = {
      template_uuid: template,
      ...(layers && { layers }),
      ...(modifications && { modifications }),
      ...(webhook_success && { webhook_success }),
      ...(create_now !== undefined && { create_now }),
      ...(passthrough && { passthrough }),
    };

    return await client.createImage(request);
  },
});