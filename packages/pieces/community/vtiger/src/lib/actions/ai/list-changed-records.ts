import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { moduleProp, toUnixSeconds } from '../../ai-common';
import { changedRecordsSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertModuleName } from '../../vtql';

export function shapeSync(result: unknown) {
  const value = isRecord(result) ? result : {};
  const ids = (list: unknown): string[] =>
    Array.isArray(list)
      ? list.flatMap((item): string[] =>
          typeof item === 'string'
            ? [item]
            : isRecord(item) && typeof item['id'] === 'string'
            ? [item['id']]
            : []
        )
      : [];
  const updated = ids(value['updated']);
  const deleted = ids(value['deleted']);
  return {
    updatedIds: updated,
    deletedIds: deleted,
    updatedCount: updated.length,
    deletedCount: deleted.length,
    more: value['more'] === true,
    lastModifiedTime: Number(value['lastModifiedTime'] ?? 0) || 0,
  };
}

export const listChangedRecordsAction = createAction({
  auth: vtigerAuth,
  name: 'list_changed_records',
  displayName: 'List Changed Records',
  description: 'Lists record IDs created, updated or deleted in a module since a point in time.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the IDs of records in one module that changed or were deleted since a timestamp, using the Vtiger sync API. When more is true, call again with lastModifiedTime as Modified Since to continue. Fetch full records with Get Record by ID.',
    idempotent: true,
  },
  outputSchema: changedRecordsSchema,
  props: {
    module: moduleProp(),
    modifiedSince: Property.ShortText({
      displayName: 'Modified Since',
      description: 'Unix seconds (e.g. 1735689600) or an ISO 8601 date such as 2026-01-01T00:00:00Z.',
      required: true,
    }),
    syncType: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Which records to include.',
      required: false,
      defaultValue: 'application',
      options: {
        options: [
          { value: 'application', label: 'All records' },
          { value: 'userandgroup', label: "User's and user's groups' records" },
          { value: 'user', label: "User's records only" },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'sync',
      query: {
        modifiedTime: String(toUnixSeconds(propsValue.modifiedSince)),
        elementType: assertModuleName(propsValue.module),
        syncType: propsValue.syncType || 'application',
      },
    });
    return shapeSync(result);
  },
});
