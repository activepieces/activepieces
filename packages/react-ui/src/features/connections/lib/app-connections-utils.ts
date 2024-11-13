import { CheckIcon, XIcon } from 'lucide-react';

import { AppConnectionStatus } from '@activepieces/shared';

export const appConnectionUtils = {
  getStatusIcon(status: AppConnectionStatus): {
    variant: 'default' | 'success' | 'error';
    icon: React.ComponentType;
  } {
    switch (status) {
      case AppConnectionStatus.ACTIVE:
        return {
          variant: 'success',
          icon: CheckIcon,
        };
      case AppConnectionStatus.ERROR:
        return {
          variant: 'error',
          icon: XIcon,
        };
    }
  },
};
