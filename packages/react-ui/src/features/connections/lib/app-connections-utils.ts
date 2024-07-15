import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

import { AppConnectionStatus } from '@activepieces/shared';

export const appConnectionUtils = {
  getStatusIcon(status: AppConnectionStatus): {
    varient: 'default' | 'success' | 'error';
    icon: React.ComponentType;
  } {
    switch (status) {
      case AppConnectionStatus.ACTIVE:
        return {
          varient: 'success',
          icon: CheckCircledIcon,
        };
      case AppConnectionStatus.ERROR:
        return {
          varient: 'error',
          icon: CrossCircledIcon,
        };
    }
  },
};
