import { CheckCircle, CheckCircle2, CircleDot, XCircle } from 'lucide-react';

import {
  Todo,
  STATUS_VARIANT as TodoStatusVariant,
} from '@activepieces/shared';

export const todoUtils = {
  getStatusIcon: (status: Todo['status']['variant']) => {
    switch (status) {
      case TodoStatusVariant.POSITIVE:
        return CheckCircle;
      case TodoStatusVariant.NEGATIVE:
        return XCircle;
      default:
        return CircleDot;
    }
  },
  getStatusIconComponent: (status: Todo['status']['variant']) => {
    switch (status) {
      case TodoStatusVariant.POSITIVE:
        return <CheckCircle2 className="w-4 h-4 text-green-700" />;
      case TodoStatusVariant.NEGATIVE:
        return <XCircle className="w-4 h-4 text-gray-700" />;
      default:
        return <CircleDot className="w-4 h-4 text-warning-300" />;
    }
  },
};
