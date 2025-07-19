import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
  videoTemplateDropdown,
  layersProperty,
  modificationsProperty,
  webhookProperty,
  createNowProperty,
  passthroughProperty,
} from '../common/props';

export const createVideo = createAction({
  auth: placidAuth,
  name: 'create_video',
  displayName: 'Create Video',
  description: 'Produce a video based on a template',
  props: {
    template: videoTemplateDropdown,
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

    // Videos require a clips array structure
    const request = {
      clips: [
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

    return await client.createVideo(request);
  },
});