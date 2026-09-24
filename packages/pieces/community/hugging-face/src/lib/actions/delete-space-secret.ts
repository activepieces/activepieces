import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { deleteSpaceSecretOutputSchema } from '../output-schemas';

export const deleteSpaceSecret = createAction({
  auth: huggingFaceAuth,
  name: 'delete_space_secret',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Space Secret',
  description: 'Delete a secret from a Hugging Face Space.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a secret from a Space; the value cannot be recovered and code that reads it will stop working. Deleting a secret restarts the Space. Only delete secrets the user asked to remove. Do not blindly retry: the key is already gone after a success. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: deleteSpaceSecretOutputSchema,
  props: {
    space_id: Property.ShortText({
      displayName: 'Space ID',
      description: "The Space ID in 'namespace/name' form, for example 'my-user/my-demo'.",
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: "The name of the secret to delete, for example 'OPENAI_API_KEY'.",
      required: true,
    }),
  },
  async run(context) {
    const { space_id, key } = context.propsValue;
    const token = context.auth.secret_text;
    const secretKey = hfWrite.assertSpaceKey(key);
    const space = await hfWrite.resolveRepo({ token, repoType: 'space', repoId: space_id });
    await hfWrite.request({
      token,
      method: HttpMethod.DELETE,
      path: `${space.apiPath}/secrets`,
      body: { key: secretKey },
    });
    return {
      space_id: space.repoId,
      key: secretKey,
      deleted: true,
    };
  },
});
