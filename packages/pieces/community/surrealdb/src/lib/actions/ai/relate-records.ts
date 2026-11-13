import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRelateRecordsOutputSchema } from '../../output-schemas';

export const relateRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_relate_records',
  outputSchema: surrealdbRelateRecordsOutputSchema,
  displayName: 'Relate Records',
  description: 'Creates a graph edge from one record to another.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates an edge record in an edge table linking one record (in) to another (out), e.g. person:tobie -> knows -> person:jaime, with optional fields on the edge, and returns the edge. Each call adds a new edge unless the edge table has a unique index. Read edges back with Find Related Records.',
    idempotent: false,
  },
  props: {
    fromRecordId: surrealdbAiProps.recordId({ required: true, displayName: 'From Record ID', description: 'Record the edge starts at, in "table:id" form, e.g. "person:tobie".' }),
    edge: Property.ShortText({
      displayName: 'Edge Table',
      description: 'Name of the edge table, e.g. "knows" or "purchased". Created if it does not exist.',
      required: true,
    }),
    toRecordId: surrealdbAiProps.recordId({ required: true, displayName: 'To Record ID', description: 'Record the edge points to, in "table:id" form, e.g. "person:jaime".' }),
    data: surrealdbAiProps.data({ required: false, description: 'Optional JSON object of fields stored on the edge, e.g. {"since": 2020}.' }),
  },
  async run(context) {
    const { fromRecordId, edge, toRecordId, data } = context.propsValue;
    const content = data === undefined ? {} : surrealdbUtils.toObject({ value: data, label: 'Data' });
    const edges = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'RELATE (type::record($from))->(type::table($edge))->(type::record($to)) CONTENT $data;',
      vars: { from: fromRecordId, edge, to: toRecordId, data: content },
    });
    return surrealdbUtils.singleRecord({ records: edges, recordId: `${fromRecordId} -> ${edge} -> ${toRecordId}` });
  },
});
