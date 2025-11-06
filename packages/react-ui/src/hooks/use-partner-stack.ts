import { ApEdition, ApFlagId } from '@activepieces/shared';

import { flagsHooks } from './flags-hooks';

interface Growsumo {
  data: {
    email: string;
    name: string;
    customer_key: string;
  };
  createSignup: () => void;
}

declare global {
  interface Window {
    growsumo: Growsumo;
  }
}

export const usePartnerStack = () => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const reportSignup = (email: string, firstName: string) => {
    const hasPartnerCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith('_ps'));
    if (edition !== ApEdition.CLOUD || !hasPartnerCookie) return;
    window.growsumo.data.email = email;
    window.growsumo.data.name = firstName;
    window.growsumo.data.customer_key = `ps_cus_key_${email}`;
    window.growsumo.createSignup();
  };

  return { reportSignup };
};
