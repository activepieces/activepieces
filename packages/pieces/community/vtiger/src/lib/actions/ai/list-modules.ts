import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { listModulesSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';

export function shapeModules(result: unknown): { modules: ModuleSummary[]; count: number } {
  const types = isRecord(result) && Array.isArray(result['types']) ? result['types'] : [];
  const information = isRecord(result) && isRecord(result['information']) ? result['information'] : {};
  const modules = types
    .filter((name): name is string => typeof name === 'string')
    .map((name) => {
      const info = isRecord(information[name]) ? information[name] : {};
      return {
        name,
        label: typeof info['label'] === 'string' ? info['label'] : name,
        singular: typeof info['singular'] === 'string' ? info['singular'] : '',
        isEntity: info['isEntity'] === true || info['isEntity'] === '1' || info['isEntity'] === 1,
      };
    });
  return { modules, count: modules.length };
}

export const listModulesAction = createAction({
  auth: vtigerAuth,
  name: 'list_modules',
  displayName: 'List Modules',
  description: 'Lists the Vtiger modules the connected user can access.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Vtiger module (element type) visible to the connected user with its API name and label. Call this first to find the exact module name (e.g. Accounts for Organizations, Potentials for Deals) that the other actions take.',
    idempotent: true,
  },
  outputSchema: listModulesSchema,
  props: {},
  async run({ auth }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'listtypes',
      query: { fieldTypeList: 'null' },
    });
    return shapeModules(result);
  },
});

type ModuleSummary = { name: string; label: string; singular: string; isEntity: boolean };
