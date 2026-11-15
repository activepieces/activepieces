import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { moduleProp } from '../../ai-common';
import { relationTypesSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertModuleName } from '../../vtql';

export function shapeRelations(result: unknown): { relations: RelationSummary[]; count: number } {
  const information = isRecord(result) && isRecord(result['information']) ? result['information'] : {};
  const relations = Object.entries(information).flatMap(([key, info]): RelationSummary[] => {
    if (!isRecord(info)) {
      return [];
    }
    return [
      {
        relationId: text(info['relation_id']) || key,
        relatedModule: text(info['name']),
        relationLabel: text(info['label']),
        translatedLabel: text(info['translated_label']),
        actions: text(info['actions']).toLowerCase(),
      },
    ];
  });
  return { relations, count: relations.length };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

export const listRelationTypesAction = createAction({
  auth: vtigerAuth,
  name: 'list_relation_types',
  displayName: 'List Relation Types',
  description: 'Lists the related lists (relations) a Vtiger module has.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the relations of a Vtiger module (e.g. Accounts to Contacts, Potentials, Documents) with their labels and related modules. Call it to get the relation label (relationLabel, not translatedLabel) and related module that Link Records, List Related Records and Query Related Records need.',
    idempotent: true,
  },
  outputSchema: relationTypesSchema,
  props: {
    module: moduleProp({ description: 'API name of the source module, for example Accounts.' }),
  },
  async run({ auth, propsValue }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'relatedtypes',
      query: { elementType: assertModuleName(propsValue.module) },
    });
    return shapeRelations(result);
  },
});

type RelationSummary = {
  relationId: string;
  relatedModule: string;
  relationLabel: string;
  translatedLabel: string;
  actions: string;
};
