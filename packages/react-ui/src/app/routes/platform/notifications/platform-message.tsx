
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlatformDialog } from './types/paltform-dialog'; 
import { PlatformAlert } from './types/platform-alert'; 


interface PlatformMessageProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  actionLink?: string;
  alert?: boolean;
  type?: 'default' | 'destructive';
}

const PlatformMessage: React.FC<PlatformMessageProps> = ({
  id,
  title,
  description,
  icon,
  actionText,
  actionLink,
  alert = true,
  type = 'default',
}) => {
  const navigate = useNavigate();

  return alert ? (
    <PlatformAlert 
      key={id}
      id={id} 
      title={title}
      description={description} 
      actionText={actionText} 
      actionLink={actionLink} 
      icon={icon} 
      type={type} />
  ) : (
    <PlatformDialog
      title={title}
      description={description}
      actionText={actionText}
      onAction={() => navigate(actionLink || '#')}
    />
  );
};

export { PlatformMessage };
