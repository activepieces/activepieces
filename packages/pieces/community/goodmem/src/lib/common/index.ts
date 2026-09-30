import {
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { goodmemAuth } from '../auth';
import { createGoodmemClient } from '../client';
import { connectionRequired } from './connection-required';

async function spaceOptions({
  auth,
}: {
  auth?: AppConnectionValueForAuthProperty<typeof goodmemAuth>;
}) {
  if (!auth) {
    return connectionRequired;
  }
  const options = [];
  for await (const space of await createGoodmemClient(
    auth.props
  ).spaces.list()) {
    options.push({
      label: `${space.name} (${space.spaceId})`,
      value: space.spaceId,
    });
  }
  return { disabled: false, options };
}

export const spaceIdDropdown = Property.Dropdown({
  displayName: 'Space',
  description: 'Select a space to use',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  options: spaceOptions,
});

export const multiSpaceDropdown = Property.MultiSelectDropdown({
  displayName: 'Spaces',
  description: 'Select one or more spaces to search across',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  options: spaceOptions,
});

export const rerankerDropdown = Property.Dropdown({
  displayName: 'Reranker',
  description:
    'Optional reranker model to improve result ordering. An LLM is not required.',
  required: false,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return connectionRequired;
    }
    const rerankers = await createGoodmemClient(auth.props).rerankers.list();
    return {
      options: rerankers.map((reranker) => ({
        label: reranker.displayName,
        value: reranker.rerankerId,
      })),
    };
  },
});

export const llmDropdown = Property.Dropdown({
  displayName: 'LLM',
  description: 'Optional LLM to generate an answer from retrieved content',
  required: false,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return connectionRequired;
    }
    const llms = await createGoodmemClient(auth.props).llms.list();
    return {
      options: llms.map((llm) => ({
        label: llm.displayName,
        value: llm.llmId,
      })),
    };
  },
});
