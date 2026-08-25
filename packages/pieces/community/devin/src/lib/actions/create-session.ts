import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { devinAuth } from '../..';

export const createSession = createAction({
  name: 'create_session',
  displayName: 'Create Session',
  description: 'Creates a new Devin session',
  audience: 'both',
  aiMetadata: { description: 'Starts a new Devin AI engineering session from a prompt, kicking off an autonomous coding/technical task. Use this to begin work; capture the returned session id for follow-up actions. Optionally seed the session from a snapshot or playbook, mark it unlisted, or set the idempotent flag so repeat calls reuse an existing session instead of spawning a new one. By default each call creates a new session.', idempotent: false },
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
        Authorization: `Bearer ${auth.secret_text}`,
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
