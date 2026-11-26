import { Property } from '@activepieces/pieces-framework';
import { supabirdAuth } from '../auth';
import { listSocialSets } from './client';

export const socialSetDropdown = Property.Dropdown({
  displayName: 'Social Set',
  description:
    'The SupaBird social set (brand) to use. Leave empty to use your default set. Required by SupaBird when your account has several sets and you are writing something.',
  auth: supabirdAuth,
  refreshers: [],
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your SupaBird account first',
      };
    }
    try {
      const sets = await listSocialSets(auth.secret_text);
      return {
        disabled: false,
        options: sets.map((set) => ({
          label: set.can_post === false ? `${set.name} (paused)` : set.name,
          value: set.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load social sets. Check your connection.',
      };
    }
  },
});
