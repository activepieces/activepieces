import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

import { AppConnectionStatus } from '@activepieces/shared';

export const appConnectionUtils = {
  findName(pieceName: string) {
    const split = pieceName.replaceAll('_', ' ').split('/')
    return split[split.length - 1].replaceAll('piece-', '');
  },
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
