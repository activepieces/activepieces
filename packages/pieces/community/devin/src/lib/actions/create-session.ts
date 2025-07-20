import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { devinAuth } from '../..';

export const createSession = createAction({
  name: 'create_session',
  displayName: 'Create Session',
  description: 'Creates a new Devin session',
  auth: devinAuth,
  props: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      required: true,
    }),
    snapshotId: Property.ShortText({
      displayName: 'Snapshot ID',
      required: false,
    }),
    playbookId: Property.ShortText({
      displayName: 'Playbook ID',
      required: false,
    }),
    unlisted: Property.Checkbox({
      displayName: 'Unlisted',
      required: false,
    }),
    idempotent: Property.Checkbox({
      displayName: 'Idempotent',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.devin.ai/v1/sessions',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        prompt: propsValue.prompt,
        snapshot_id: propsValue.snapshotId,
        playbook_id: propsValue.playbookId,
        unlisted: propsValue.unlisted,
        idempotent: propsValue.idempotent,
      },
    });
    return response.body;
  },
});
