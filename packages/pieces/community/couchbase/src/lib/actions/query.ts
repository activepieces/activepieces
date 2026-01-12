import { createAction, Property } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  createCouchbaseClient,
  closeCluster,
  CouchbaseAuthValue,
  LooseObject,
} from '../common';
import { QueryOptions, QueryScanConsistency } from 'couchbase';

export default createAction({
  auth: couchbaseAuth,
  name: 'query',
  displayName: 'Execute SQL++ Query',
  description: 'Run a SQL++ (N1QL) query with optional vector search filters',
  props: {
    bucket: couchbaseCommonProps.bucket,
    scope: couchbaseCommonProps.scope,
    query: couchbaseCommonProps.query,
    arguments: couchbaseCommonProps.arguments,
    vectorFilters: couchbaseCommonProps.vectorFilters,
    vectorOrder: couchbaseCommonProps.vectorOrder,
    limit: couchbaseCommonProps.limit,
    offset: couchbaseCommonProps.offset,
    scanConsistency: Property.StaticDropdown({
      displayName: 'Scan Consistency',
      description: 'Query consistency level',
      required: false,
      options: {
        options: [
          { label: 'Not Bounded (Fastest)', value: QueryScanConsistency.NotBounded },
          { label: 'Request Plus (Consistent)', value: QueryScanConsistency.RequestPlus },
        ],
      },
    }),
    timeout: couchbaseCommonProps.timeout,
  },
  async run(context) {
    const auth = (context.auth as { props: CouchbaseAuthValue }).props;
    const {
      bucket,
      scope,
      query,
      arguments: queryArgs,
      vectorFilters,
      vectorOrder,
      limit,
      offset,
      scanConsistency,
      timeout,
    } = context.propsValue;

    if (!query) {
      throw new Error('Query is required');
    }

    const limitValue = Math.round(limit || 0);
    const offsetValue = Math.round(offset || 0);

    let userQuery = query;
    const userQueryUpperCase = userQuery.toUpperCase();
    const args: string[] = [...((queryArgs as string[]) || [])];

    if (userQueryUpperCase.includes('LIMIT') || userQueryUpperCase.includes('OFFSET')) {
      throw new Error('Do not include LIMIT or OFFSET in the query. Use the Limit and Offset fields instead.');
    }

    const whereClauseParts: string[] = [];
    const orderClauseParts: string[] = [];

    if (vectorFilters && Array.isArray(vectorFilters)) {
      for (const elem of vectorFilters) {
        const filter = elem as LooseObject;
        const funcName = filter['preciseDistance'] ? 'VECTOR_DISTANCE' : 'APPROX_VECTOR_DISTANCE';
        whereClauseParts.push(
          `${funcName}(${filter['vectorExpr']}, ${filter['targetVector']}, "${filter['vectorSimilarity']}") < ?`
        );
        args.push(String(filter['maxDistance']));
      }
    }

    if (vectorOrder && Array.isArray(vectorOrder)) {
      for (const elem of vectorOrder) {
        const order = elem as LooseObject;
        const funcName = order['preciseDistance'] ? 'VECTOR_DISTANCE' : 'APPROX_VECTOR_DISTANCE';
        orderClauseParts.push(
          `${funcName}(${order['vectorExpr']}, ${order['targetVector']}, "${order['vectorSimilarity']}")`
        );
      }
    }

    if (whereClauseParts.length > 0) {
      const whereClause = whereClauseParts.join(' AND ');
      const orderByIndex = userQueryUpperCase.indexOf('ORDER BY');

      if (userQueryUpperCase.includes('WHERE')) {
        userQuery = userQuery.replace(/WHERE/i, `WHERE ${whereClause} AND `);
      } else if (orderByIndex > -1) {
        userQuery = userQuery.slice(0, orderByIndex) + `WHERE ${whereClause} ` + userQuery.slice(orderByIndex);
      } else {
        userQuery += ` WHERE ${whereClause}`;
      }
    }

    if (orderClauseParts.length > 0) {
      const orderClause = orderClauseParts.join(', ');
      if (userQueryUpperCase.indexOf('ORDER BY') > -1) {
        userQuery += `, ${orderClause}`;
      } else {
        userQuery += ` ORDER BY ${orderClause}`;
      }
    }

    let finalQuery = `SELECT RAW data FROM (${userQuery}) data`;

    if (limitValue > 0) {
      finalQuery += ` LIMIT ${limitValue}`;
    }

    if (offsetValue > 0) {
      finalQuery += ` OFFSET ${offsetValue}`;
    }

    const cluster = await createCouchbaseClient(auth);

    try {
      const options: QueryOptions = {};

      if (args.length > 0) {
        options.parameters = args;
      }

      if (scanConsistency !== undefined && scanConsistency !== null) {
        options.scanConsistency = scanConsistency as QueryScanConsistency;
      }

      if (timeout && timeout > 0) {
        options.timeout = timeout;
      }

      let result;

      if (bucket && scope) {
        const bucketObj = cluster.bucket(bucket);
        const scopeObj = bucketObj.scope(scope);
        result = await scopeObj.query(finalQuery, options);
      } else {
        result = await cluster.query(finalQuery, options);
      }

      return {
        rows: result.rows,
        meta: {
          requestId: result.meta.requestId,
          status: result.meta.status,
          metrics: result.meta.metrics,
        },
      };
    } finally {
      await closeCluster(cluster);
    }
  },
});
