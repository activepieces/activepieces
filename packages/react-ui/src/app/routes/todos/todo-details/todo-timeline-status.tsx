import { t } from 'i18next';

import { STATUS_VARIANT, Todo } from '@activepieces/shared';

interface TodoTimelineStatusProps {
  todo: Todo;
}

export const TodoTimelineStatus = ({ todo }: TodoTimelineStatusProps) => {
  if (todo.status.variant === STATUS_VARIANT.NEUTRAL) {
    return null;
  }

  const bgColor = {
    [STATUS_VARIANT.POSITIVE]: 'bg-emerald-700',
    [STATUS_VARIANT.NEGATIVE]: 'bg-destructive-300',
    [STATUS_VARIANT.NEUTRAL]: 'bg-gray-700',
  }[todo.status.variant];

  return (
    <div className="flex justify-center mt-6">
      <div
        className={`${bgColor} text-background text-sm rounded-sm py-1 px-4`}
      >
        {t(`This todo is now marked as ${todo.status.name}`)}
      </div>
    </div>
  );
};
