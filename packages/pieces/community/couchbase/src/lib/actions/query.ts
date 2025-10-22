import { createAction, LongTextProperty, Property } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  apiGet,
  LooseObject,
  checkForErrors,
} from '../common';
import { httpClient } from '@activepieces/pieces-common';

export default createAction({
  auth: couchbaseAuth,
  name: 'query',
  displayName: 'Select via SQL++ Query',
  description: 'Executes SQL++ SELECT query with optional vector filters and returns its results as array with counter',
  props: {
    query: couchbaseCommonProps.query,
    arguments: couchbaseCommonProps.arguments,
    vectorFilters: couchbaseCommonProps.vectorFilters,
    vectorOrder: couchbaseCommonProps.vectorOrder,
    offset: couchbaseCommonProps.offset,
    limit: couchbaseCommonProps.limit,
  },
  run: async function(context) {
    const limit = Math.round(context.propsValue.limit || 0);
    const offset = Math.round(context.propsValue.offset || 0);

    if (!context.propsValue.query) {
      throw new Error('Query statement is required');
    }

    let userQuery = context.propsValue.query;
    const userQueryUpperCase = userQuery.toUpperCase();
    const queryArgs = context.propsValue.arguments as string[];

    const orderClauseParts: string[] = new Array<string>();
    const whereClauseParts: string[] = new Array<string>();

    if (context.propsValue.vectorFilters) {
      for (const elem of context.propsValue.vectorFilters) {
        const filter = elem as LooseObject;
        const funcname = filter['preciseDistance'] ? 'vector_distance' : 'approx_vector_distance';
        whereClauseParts.push(funcname + '(' + (filter['vectorExpr'] as string) + ', ' + (filter['targetVector'] as string) + ', "' + (filter['vectorSimilarity'] as string) + '") < ?');
        queryArgs.push(
          filter['maxDistance'] as string
        );
      }
    }

    if (context.propsValue.vectorOrder) {
      for (const elem of context.propsValue.vectorOrder) {
        const filter = elem as LooseObject;
        const funcname = filter['preciseDistance'] ? 'vector_distance' : 'approx_vector_distance';
        orderClauseParts.push(funcname + '(' + (filter['vectorExpr'] as string) + ', ' + (filter['targetVector'] as string) + ', "' + (filter['vectorSimilarity'] as string) + '")');
      }
    }

    const limitIndex = userQueryUpperCase.indexOf("LIMIT")
    const offsetIndex = userQueryUpperCase.indexOf("OFFSET")
    const orderByIndex = userQueryUpperCase.indexOf("ORDER BY")

    if (limitIndex > -1 || offsetIndex > -1) {
      throw new Error("LIMIT and OFFSET clause usage directly in SQL++ query is not supported, please use limit and offset fields")
    }

    if (whereClauseParts.length > 0) {
      const whereClause= whereClauseParts.join(' AND ') + " "
      if (userQuery.includes("WHERE")) {
        // bingo!
        userQuery = userQuery.replace("WHERE", "WHERE " + whereClause + " AND");
      } else if (orderByIndex > -1) {
          userQuery = userQuery.replace("ORDER BY", "WHERE" + whereClause + " ORDER BY");
      } else {
        userQuery += " WHERE " + whereClause;
      }
    }

    if (orderClauseParts.length > 0) {
      const orderClause = orderClauseParts.join(', ') + " ";
      if (orderByIndex > -1) {
        // user query already includes ORDER BY clause
        // ORDER BY is the last clause, so simply adding generated clause at the end
        userQuery += ", " + orderClause;
      } else {
        // user query does not include ORDER BY clause
        userQuery += " ORDER BY " + orderClause;
      }
    }

    let query = "SELECT RAW data FROM (" + userQuery + ") data";

    if (limit > 0) {
      query += " LIMIT " + limit;
    }

    if (offset > 0) {
      query += " OFFSET " + offset;
    }

    const response = await httpClient.sendRequest(
      apiGet(context.auth, query, (context.propsValue.arguments || []) as string[])
    );

    checkForErrors(response);
    return response.body;
  }
});
