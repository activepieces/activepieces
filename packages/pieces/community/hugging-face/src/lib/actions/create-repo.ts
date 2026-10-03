import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { createRepoOutputSchema } from '../output-schemas';

export const createRepo = createAction({
  auth: huggingFaceAuth,
  name: 'create_repo',
  classification: 'WRITE',
  displayName: 'Create Repository',
  description: 'Create a model, dataset or Space repository on the Hugging Face Hub, or return it if it already exists.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a model, dataset or Space repository under the connected user or an organization, private by default; if a repository with that name already exists it is returned unchanged with created:false, so retries are safe. Only set Visibility to Public when the user explicitly asks, because a public repository is visible to everyone. Spaces need an SDK: 'static' is free for everyone, while 'gradio' and 'docker' need a PRO/Team subscription or billing on the account; no paid hardware is ever requested. Add files afterwards with Commit Files. Requires a write-role token (and write rights in the organization).",
    idempotent: true,
  },
  outputSchema: createRepoOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    name: Property.ShortText({
      displayName: 'Repository Name',
      description:
        "The repository name, for example 'my-model'. You may also pass 'namespace/name' to create it under an organization.",
      required: true,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description:
        'Optional organization to create the repository in. Leave empty to create it under the connected user.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Private (default) or Public. Public repositories are visible to everyone, so choose Public only when explicitly asked.',
      required: false,
      defaultValue: 'private',
      options: {
        disabled: false,
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    space_sdk: Property.StaticDropdown({
      displayName: 'Space SDK',
      description: "Required when Repository Type is 'space': the framework the Space runs. 'static' is free for everyone; 'gradio' and 'docker' need a PRO/Team subscription or billing. Ignored for models and datasets.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Static (HTML)', value: 'static' },
          { label: 'Gradio', value: 'gradio' },
          { label: 'Docker', value: 'docker' },
        ],
      },
    }),
  },
  async run(context) {
    const { repo_type, name, organization, visibility, space_sdk } = context.propsValue;
    const token = context.auth.secret_text;
    const typeInfo = hfRepo.getTypeInfo(repo_type);
    const rawName = hfWrite.requireText({ value: name, name: 'Repository Name' });
    const parts = rawName.split('/').filter((segment) => segment.length > 0);
    if (parts.length > 2 || parts.length === 0) {
      throw new Error("Repository Name must be 'name' or 'namespace/name'.");
    }
    const repoName = parts[parts.length - 1];
    const namespaceFromName = parts.length === 2 ? parts[0] : undefined;
    const orgInput = hfWrite.optionalText({ value: organization, name: 'Organization' });
    if (namespaceFromName && orgInput && namespaceFromName !== orgInput) {
      throw new Error(
        `The namespace in Repository Name ('${namespaceFromName}') differs from Organization ('${orgInput}'). Pass only one.`
      );
    }
    if (typeInfo.singular === 'space' && !space_sdk) {
      throw new Error("Space SDK is required when creating a Space. Choose 'static', 'gradio' or 'docker'.");
    }
    const username = await hfWrite.currentUsername(token);
    const requestedNamespace = namespaceFromName ?? orgInput;
    const organizationToSend =
      requestedNamespace && requestedNamespace !== username ? requestedNamespace : undefined;
    const namespace = organizationToSend ?? username;
    const isPrivate = visibility !== 'public';
    const body: Record<string, unknown> = {
      type: typeInfo.singular,
      name: repoName,
      private: isPrivate,
    };
    if (organizationToSend) {
      body['organization'] = organizationToSend;
    }
    if (typeInfo.singular === 'space') {
      body['sdk'] = space_sdk;
    }
    const repoId = `${namespace}/${repoName}`;
    const webUrl = `${hfHub.baseUrl}/${typeInfo.resolvePrefix}${repoId}`;
    const outcome = await hfWrite.createOrConflict({
      token,
      method: HttpMethod.POST,
      path: '/api/repos/create',
      body,
    });
    if (!outcome.conflict) {
      return {
        created: true,
        repo_id: repoId,
        repo_type: typeInfo.singular,
        url: hfWrite.readString({ record: outcome.body, key: 'url' }) ?? webUrl,
        private: isPrivate,
      };
    }
    const existing = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `/api/${typeInfo.apiSegment}/${hfRepo.encodeRepoId(repoId)}`,
    });
    const existingBody = hfHub.isRecord(existing.body) ? existing.body : {};
    const existingPrivate = existingBody['private'];
    return {
      created: false,
      repo_id: typeof existingBody['id'] === 'string' ? existingBody['id'] : repoId,
      repo_type: typeInfo.singular,
      url: hfWrite.readString({ record: outcome.body, key: 'url' }) ?? webUrl,
      private: typeof existingPrivate === 'boolean' ? existingPrivate : null,
    };
  },
});
