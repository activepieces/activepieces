import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { upsertSpaceSecretOutputSchema } from '../output-schemas';

export const upsertSpaceSecret = createAction({
  auth: huggingFaceAuth,
  name: 'upsert_space_secret',
  classification: 'WRITE',
  displayName: 'Set Space Secret',
  description: 'Create or update a secret environment variable of a Hugging Face Space.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates or overwrites a secret (a private environment variable such as an API key) on a Space, keyed by name. Setting a secret restarts the Space, which briefly takes it offline and, on paid hardware, bills the restart. The value is never returned or readable back; the result only confirms the key. For non-sensitive settings use Set Space Variable. Re-setting the same key and value converges, so it is safe to retry. Requires a write-role token.",
    idempotent: true,
  },
  outputSchema: upsertSpaceSecretOutputSchema,
  props: {
    space_id: Property.ShortText({
      displayName: 'Space ID',
      description: "The Space ID in 'namespace/name' form, for example 'my-user/my-demo'.",
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: "The secret name: starts with a letter, then letters, digits or underscores, for example 'OPENAI_API_KEY'.",
      required: true,
    }),
    value: Property.LongText({
      displayName: 'Value',
      description: 'The secret value. It is stored encrypted and never shown again.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional note about what the secret is for.',
      required: false,
    }),
  },
  async run(context) {
    const { space_id, key, value, description } = context.propsValue;
    const token = context.auth.secret_text;
    const secretKey = hfWrite.assertSpaceKey(key);
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error('Value is required.');
    }
    const note = hfWrite.optionalText({ value: description, name: 'Description' });
    const space = await hfWrite.resolveRepo({ token, repoType: 'space', repoId: space_id });
    const body: Record<string, unknown> = { key: secretKey, value };
    if (note !== undefined) {
      body['description'] = note;
    }
    await hfWrite.sensitiveRequest({
      token,
      method: HttpMethod.POST,
      path: `${space.apiPath}/secrets`,
      body,
    });
    return {
      space_id: space.repoId,
      key: secretKey,
      updated: true,
    };
  },
});
