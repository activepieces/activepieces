import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { STATUS_COLORS } from '@activepieces/shared';
import { Todo } from '@activepieces/shared';
import { CircleDot, CheckCircle, X } from 'lucide-react';

interface TodoTimelineStatusProps {
  todo: Todo;
}

export const TodoTimelineStatus = ({ todo }: TodoTimelineStatusProps) => {
  if (!todo.status) {
    return null;
  }

  const getStatusIcon = (statusVariant: string) => {
    if (statusVariant === 'negative') {
      return X;
    }
    if (statusVariant === 'positive') {
      return CheckCircle;
    }
    return CircleDot;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-2 mt-6">
      <div className="flex-shrink-0">
        <StatusIconWithText
          icon={getStatusIcon(todo.status.variant)}
          text={`This todo is now marked as ${todo.status.name}`}
          color={STATUS_COLORS[todo.status.variant].color}
          textColor={STATUS_COLORS[todo.status.variant].textColor}
        />
      </div>
    </div>
  );
};