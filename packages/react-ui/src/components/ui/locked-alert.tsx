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
    <Alert className="flex items-center gap-4 mb-4">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-primary-600 mt-1" />
        <div>
          <AlertTitle className="font-semibold text-lg">{title}</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDescription>
        </div>
      </div>
      <div className="ml-auto">{button}</div>
    </Alert>
  );
};
