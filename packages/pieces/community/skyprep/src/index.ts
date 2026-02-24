import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { skyprepAuth } from './lib/common/auth';
import { enrollAUserIntoACource } from './lib/actions/enroll-a-user-into-a-cource';
import { enrollAUserIntoAUserGroup } from './lib/actions/enroll-a-user-into-a-user-group';
import { updateUser } from './lib/actions/update-user';
import { courceFailed } from './lib/triggers/cource-failed';
import { newUser } from './lib/triggers/new-user';
import { courcePassed } from './lib/triggers/cource-passed';

export const skyprep = createPiece({
  displayName: 'SkyPrep',
  auth: skyprepAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/skyprep.png',
  description:
    ' SkyPrep is a powerful Learning Management System (LMS) designed to help businesses and organizations deliver effective training and educational content to their employees and users.',
  authors: ['sanket-a11y'],
  actions: [enrollAUserIntoACource, enrollAUserIntoAUserGroup, updateUser],
  triggers: [courceFailed, courcePassed, newUser],
});
