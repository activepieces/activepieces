// 2026-11-16 +03: shared props. Why: the sender ID dropdown reads the account's own sender IDs from POST /API/senderid/.
import { Property } from '@activepieces/pieces-framework';
import { kwtsmsAuth } from '../auth';
import { callKwtsms } from './index';

export const kwtsmsProps = {
  senderId: () =>
    Property.Dropdown({
      auth: kwtsmsAuth,
      displayName: 'Sender ID',
      description:
        'Your approved sender IDs. KWT-SMS is for testing only; use a private sender ID in production.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your kwtSMS account first',
          };
        }
        try {
          const res = await callKwtsms<{ senderid?: string[] }>(
            'senderid',
            auth.props,
          );
          return {
            disabled: false,
            options: (res.senderid ?? []).map((s) => ({ label: s, value: s })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: `Could not load sender IDs: ${(e as Error).message}`,
          };
        }
      },
    }),
  mobiles: (description: string) =>
    Property.Array({
      displayName: 'Mobile Numbers',
      description,
      required: true,
    }),
};
