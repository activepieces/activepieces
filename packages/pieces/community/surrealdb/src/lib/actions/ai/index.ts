import { countRecordsAction } from './count-records';
import { createRecordAction } from './create-record';
import { deleteRecordAction } from './delete-record';
import { deleteRecordsAction } from './delete-records';
import { describeTableAction } from './describe-table';
import { exportDatabaseAction } from './export-database';
import { findRecordsAction } from './find-records';
import { findRelatedRecordsAction } from './find-related-records';
import { getDatabaseInfoAction } from './get-database-info';
import { getRecordAction } from './get-record';
import { importDataAction } from './import-data';
import { insertRecordsAction } from './insert-records';
import { listDatabasesAction } from './list-databases';
import { listNamespacesAction } from './list-namespaces';
import { listTablesAction } from './list-tables';
import { mergeRecordAction } from './merge-record';
import { patchRecordAction } from './patch-record';
import { relateRecordsAction } from './relate-records';
import { replaceRecordAction } from './replace-record';
import { runFunctionAction } from './run-function';
import { runGqlQueryAction } from './run-gql-query';
import { runGraphqlQueryAction } from './run-graphql-query';
import { updateRecordsAction } from './update-records';
import { upsertRecordAction } from './upsert-record';

export const surrealdbAiActions = [
  listNamespacesAction,
  listDatabasesAction,
  listTablesAction,
  getDatabaseInfoAction,
  describeTableAction,
  findRecordsAction,
  getRecordAction,
  countRecordsAction,
  createRecordAction,
  insertRecordsAction,
  replaceRecordAction,
  mergeRecordAction,
  patchRecordAction,
  upsertRecordAction,
  deleteRecordAction,
  updateRecordsAction,
  deleteRecordsAction,
  relateRecordsAction,
  findRelatedRecordsAction,
  runFunctionAction,
  runGqlQueryAction,
  runGraphqlQueryAction,
  exportDatabaseAction,
  importDataAction,
];
