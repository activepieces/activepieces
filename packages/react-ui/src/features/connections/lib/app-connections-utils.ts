import { AppConnectionStatus } from '@activepieces/shared';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

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
