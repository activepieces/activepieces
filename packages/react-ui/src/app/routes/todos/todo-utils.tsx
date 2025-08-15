import { CheckCircle, CheckCircle2, CircleDot, XCircle } from 'lucide-react';
import { t } from 'i18next';

import {
  Todo,
  STATUS_VARIANT as TodoStatusVariant,
} from '@activepieces/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {getIcon(status)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText(status)}</p>
        </TooltipContent>
      </Tooltip>
    );
  },
};


const getTooltipText = (status: Todo['status']['variant']) => {
  switch (status) {
    case TodoStatusVariant.POSITIVE:
      return t('Resolved');
    case TodoStatusVariant.NEGATIVE:
      return t('Rejected');
    default:
      return t('Pending');
  }
};

const getIcon = (status: Todo['status']['variant']) => {
  switch (status) {
    case TodoStatusVariant.POSITIVE:
      return <CheckCircle2 className="w-5 h-5 text-green-700" />;
    case TodoStatusVariant.NEGATIVE:
      return <XCircle className="w-5 h-5 text-gray-700" />;
    default:
      return <CircleDot className="w-5 h-5 text-warning-300" />;
  }
};