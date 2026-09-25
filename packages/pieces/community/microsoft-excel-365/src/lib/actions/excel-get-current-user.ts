import { createAction } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth } from '../common/helpers';

export const excelGetCurrentUser = createAction({
  auth: excelAuth,
  name: 'excel_get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the connected account\'s identity and OneDrive.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the connected account\'s user ID, display name, email (when Microsoft provides it) and its OneDrive ID and type, read from the user\'s own drive. Use to confirm which account and drive the other excel_* atomics act on. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const drive: GraphDrive = await createMSGraphClientFromAuth({ auth: context.auth }).api('/me/drive').get();
    const user = drive.owner?.user;
    return {
      userId: user?.id ?? null,
      displayName: user?.displayName ?? null,
      email: user?.email ?? null,
      driveId: drive.id ?? null,
      driveType: drive.driveType ?? null,
    };
  },
});

type GraphDrive = {
  id?: string | null;
  driveType?: string | null;
  owner?: {
    user?: { id?: string | null; displayName?: string | null; email?: string | null } | null;
  } | null;
};
