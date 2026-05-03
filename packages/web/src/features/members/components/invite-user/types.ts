import { UserWithMetaInformation } from '@activepieces/shared';

export type EmailStatusType =
  | {
      email: string;
      type: 'has-access' | 'in-project' | 'already-invited';
      user: UserWithMetaInformation | undefined;
    }
  | {
      email: string;
      type: 'new-user';
      user: undefined;
    };
