import getAction from './get-user';
import listAction from './list-users';
import createAction from './create-user';
import updateAction from './update-user';
import deleteAction from './delete-user';
import currentUserAction from './get-current-user';

export default [
  getAction,
  listAction,
  createAction,
  updateAction,
  deleteAction,
  currentUserAction,
];
