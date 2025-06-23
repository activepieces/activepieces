import { SparklesIcon, AlertCircle } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PlatformAlertProps {
  title: string;
  description: React.ReactNode;
  actionText?: string;
  actionLink?: string;
  icon?: React.ReactNode;
  type?: 'default' | 'destructive';
}

export const PlatformAlert: React.FC<PlatformAlertProps> = ({
  title,
  description,
  actionText,
  actionLink,
  icon = <SparklesIcon className="h-4 w-4" />,
  type = 'default',
}) => {
  const navigate = useNavigate();

  return (
    <Alert variant={type} className="flex items-start">
      {type === 'destructive' ? <AlertCircle className="h-4 w-4" /> : icon}
      <div className="flex-grow">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
      {actionText && actionLink && (
        <Button
          variant="link"
          className={
            type === 'destructive'
              ? ' text-destructive-300'
              : 'text-primary-300'
          }
          onClick={() => navigate(actionLink)}
        >
          {actionText}
        </Button>
      )}
    </Alert>
  );
};

export default PlatformAlert;
