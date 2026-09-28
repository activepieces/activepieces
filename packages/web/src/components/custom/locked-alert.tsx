import { LockKeyholeIcon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface LockedAlertProps {
  title: string;
  description: string;
  button: React.ReactNode;
}

export const LockedAlert = ({
  title,
  description,
  button,
}: LockedAlertProps) => {
  return (
    <Alert className="flex items-center gap-4 mb-4">
      <div className="flex items-start gap-3">
        <HugeiconsIcon
          icon={LockKeyholeIcon}
          className="h-5 w-5 text-accent-11 mt-1"
        />
        <div>
          <AlertTitle className="font-semibold text-lg">{title}</AlertTitle>
          <AlertDescription className="text-sm text-gray-11">
            {description}
          </AlertDescription>
        </div>
      </div>
      <div className="ml-auto">{button}</div>
    </Alert>
  );
};
