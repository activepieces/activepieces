import executeQuery from './execute-query';
import getTables from './get-tables';
import insertRow from './insert-row';
import { insertRows } from './insert-rows';
import updateRows from './update-row';
import deleteRows from './delete-row';
import selectRows from './find-rows';

export default [
  selectRows,
  insertRow,
  insertRows,
  updateRows,
  deleteRows,
  getTables,
  executeQuery,
];
