import { Lock } from 'lucide-react';

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
    <Alert className="flex items-center gap-4">
      <div className="flex items-start gap-3">
        <Lock className="h-lh w-4 shrink-0 text-accent-11" />
        <div>
          <AlertTitle className="font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-gray-11">
            {description}
          </AlertDescription>
        </div>
      </div>
      <div className="ml-auto">{button}</div>
    </Alert>
  );
};
