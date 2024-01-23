import entryActions from './entry';
import customerActions from './customer';
import projectActions from './project';
import serviceActions from './service';
import teamActions from './team';
import userActions from './user';
import absenceActions from './absence';

export default [
  ...entryActions,
  ...customerActions,
  ...projectActions,
  ...serviceActions,
  ...teamActions,
  ...userActions,
  ...absenceActions,
];
