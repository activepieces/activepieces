import { aiCreateCustomer, aiDeleteCustomer, aiGetCustomer, aiUpdateCustomer } from './ai-customer';
import { aiCreateProject, aiDeleteProject, aiGetProject, aiUpdateProject } from './ai-project';
import { aiDeleteService, aiGetService, aiUpdateService } from './ai-service';
import { aiCreateUser, aiDeleteUser, aiGetUser, aiUpdateUser } from './ai-user';
import { aiGetTeam } from './ai-team';
import { aiCreateEntry, aiUpdateEntry } from './ai-entry';
import { aiCreateAbsence, aiListAbsences, aiUpdateAbsence } from './ai-absence';
import { aiStartClock } from './ai-clock';

export default [
  aiCreateCustomer,
  aiGetCustomer,
  aiUpdateCustomer,
  aiDeleteCustomer,
  aiCreateProject,
  aiGetProject,
  aiUpdateProject,
  aiDeleteProject,
  aiGetService,
  aiUpdateService,
  aiDeleteService,
  aiCreateUser,
  aiGetUser,
  aiUpdateUser,
  aiDeleteUser,
  aiGetTeam,
  aiCreateEntry,
  aiUpdateEntry,
  aiCreateAbsence,
  aiUpdateAbsence,
  aiListAbsences,
  aiStartClock,
];
