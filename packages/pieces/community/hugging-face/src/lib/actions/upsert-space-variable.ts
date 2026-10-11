import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { upsertSpaceVariableOutputSchema } from '../output-schemas';

export const upsertSpaceVariable = createAction({
  auth: huggingFaceAuth,
  name: 'upsert_space_variable',
  classification: 'WRITE',
  displayName: 'Set Space Variable',
  description: 'Create or update a public environment variable of a Hugging Face Space.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates or overwrites a public environment variable (a non-sensitive setting such as a model name) on a Space, keyed by name. Variables are visible to anyone who can see the Space, so put API keys and passwords in Set Space Secret instead. Setting a variable restarts the Space. Re-setting the same key and value converges, so it is safe to retry. Requires a write-role token.",
    idempotent: true,
  },
  outputSchema: upsertSpaceVariableOutputSchema,
  props: {
    space_id: Property.ShortText({
      displayName: 'Space ID',
      description: "The Space ID in 'namespace/name' form, for example 'my-user/my-demo'.",
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: "The variable name: starts with a letter, then letters, digits or underscores, for example 'MODEL_NAME'.",
      required: true,
    }),
    value: Property.LongText({
      displayName: 'Value',
      description: 'The variable value. It is visible to anyone who can see the Space.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional note about what the variable is for.',
      required: false,
    }),
  },
  async run(context) {
    const { space_id, key, value, description } = context.propsValue;
    const token = context.auth.secret_text;
    const variableKey = hfWrite.assertSpaceKey(key);
    if (typeof value !== 'string') {
      throw new Error('Value is required.');
    }
    const note = hfWrite.optionalText({ value: description, name: 'Description' });
    const space = await hfWrite.resolveRepo({ token, repoType: 'space', repoId: space_id });
    const body: Record<string, unknown> = { key: variableKey, value };
    if (note !== undefined) {
      body['description'] = note;
    }
    await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${space.apiPath}/variables`,
      body,
    });
    return {
      space_id: space.repoId,
      key: variableKey,
      updated: true,
    };
  },
});
