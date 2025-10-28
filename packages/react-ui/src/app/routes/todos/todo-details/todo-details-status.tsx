import { CheckCircle, X, CircleDot, Loader } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  Todo,
  UNRESOLVED_STATUS,
  STATUS_VARIANT,
  STATUS_COLORS,
} from '@activepieces/shared';

type TodoDetailsStatusProps = {
  todo: Todo;
  isUpdatingStatus: boolean;
  onStatusChange: (status: Todo['status'], source: 'agent' | 'manual') => void;
};

export const TodoDetailsStatus = ({
  todo,
  isUpdatingStatus,
  onStatusChange,
}: TodoDetailsStatusProps) => {
  const getStatusIcon = (statusVariant: string) => {
    if (statusVariant === STATUS_VARIANT.NEGATIVE) {
      return X;
    }
    if (statusVariant === STATUS_VARIANT.POSITIVE) {
      return CheckCircle;
    }
    return CircleDot;
  };

  const getStatusButtonIcon = (statusName: string, variant: string) => {
    if (statusName === UNRESOLVED_STATUS.name) {
      return <CircleDot className="h-4 w-4 text-warning-300" />;
    }
    if (variant === STATUS_VARIANT.NEGATIVE) {
      return <X className="h-4 w-4 text-destructive-300" />;
    }
    return <CheckCircle className="h-4 w-4 text-success-300" />;
  };

  const isResolved =
    todo.status.name !== UNRESOLVED_STATUS.name &&
    todo.status.continueFlow !== false;

  return (
    <div className="flex items-center gap-2">
      <StatusIconWithText
        icon={getStatusIcon(todo.status.variant)}
        text={todo.status.name}
        color={STATUS_COLORS[todo.status.variant].color}
        textColor={STATUS_COLORS[todo.status.variant].textColor}
      />
      {!isResolved && !todo.locked && (
        <div className="flex items-center gap-2">
          {todo.statusOptions.map((status) => (
            <Button
              key={status.name}
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex gap-2 items-center"
              onClick={() => onStatusChange(status, 'manual')}
              disabled={isUpdatingStatus || status.name === todo.status.name}
            >
              {isUpdatingStatus && status.name === todo.status.name ? (
                <Loader className="h-4 w-4" />
              ) : (
                <>
                  {getStatusButtonIcon(status.name, status.variant)}
                  <span className={`text-sm`}>Mark as {status.name}</span>
                </>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
