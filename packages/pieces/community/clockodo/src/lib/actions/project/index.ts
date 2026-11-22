import createAction from './create-project';
import getAction from './get-project';
import updateAction from './update-project';
import listAction from './list-projects';
import deleteAction from './delete-project';
import listSubprojectsAction from './list-subprojects';

export default [
  createAction,
  getAction,
  listAction,
  updateAction,
  deleteAction,
  listSubprojectsAction,
];
