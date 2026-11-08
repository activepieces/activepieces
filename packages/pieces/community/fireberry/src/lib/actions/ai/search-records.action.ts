import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient, fireberryUtils } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiSearchRecordsAction = createAction({
  auth: fireberryAuth,
  name: 'ai_search_records',
  displayName: 'Search Records',
  description: 'Searches records of a Fireberry object type with a Fireberry query.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: fireberryOutputSchemas['searchRecords'],
  aiMetadata: {
    description: "Searches records of one Fireberry object type. The query uses Fireberry syntax: (fieldname = 'value'); date/datetime values are unquoted in account-local time, e.g. (modifiedon >= 2026-11-01T15:20:00) with no Z, operators =, !=, >, <, >=, <=, start-with, not-start-with, is-null, is-not-null, combined with and / or, e.g. (emailaddress1 = 'a@b.com') or ((statuscode = 1) and (accountname start-with 'Ac')). Leave the query empty to list records. Returns up to 50 records per page and at most 10 pages (500 records) per query; check isLastPage and raise pageNumber to continue. Picklist fields hold numeric string codes (see List Picklist Values) when fields is empty; when fields is given, picklist and lookup values come back as their display labels (e.g. \"Active\") instead. Timestamps such as createdon/modifiedon are account-local time without offset. Each record includes its id under the primaryKey field name.",
    idempotent: true,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: "Fireberry query, e.g. (emailaddress1 = 'a@b.com'). Leave empty to list all records.",
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Field system names to return. Leave empty to return all fields.',
      required: false,
    }),
    sortBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field system name to sort by (e.g. modifiedon).',
      required: false,
    }),
    sortType: Property.StaticDropdown({
      displayName: 'Sort Direction',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Records per page, 1-50. Defaults to 50.',
      required: false,
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      description: 'Page to return, 1-10. Defaults to 1.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const objectType = await client.resolveObjectTypeNumber(propsValue.objectSystemName);
    const fields = (propsValue.fields ?? []).map((field) => String(field));
    const body = fireberryUtils.buildQueryBody({
      objectType,
      fields,
      query: propsValue.query,
      sortBy: propsValue.sortBy,
      sortType: propsValue.sortType,
      pageSize: propsValue.pageSize,
      pageNumber: propsValue.pageNumber,
    });
    const result = await client.query(body);
    return {
      records: result.Data,
      recordCount: result.Data.length,
      pageNumber: result.PageNum,
      isLastPage: result.IsLastPage,
      primaryKey: result.PrimaryKey,
      primaryField: result.PrimaryField,
    };
  },
});
