import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SparklesIcon, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PlatformMessageProps {
    id: string;
    title: string;
    description: string;
    actionText?: string;
    actionLink?: string;
    icon?: React.ReactNode;
    type?: 'default' | 'destructive';
}

export const PlatformAlert: React.FC<PlatformMessageProps> = ({
    id,
    title,
    description,
    actionText,
    actionLink,
    icon = <SparklesIcon className="h-4 w-4" />,
    type = 'default',
}) => {
    const navigate = useNavigate();

    return (
        <Alert key={id} variant={type} className={cn('flex items-start', type === 'destructive' ? 'text-destructive-300' : '')}>
            {type === 'destructive' ? (
                <AlertCircle className="h-4 w-4" />
            ): icon}
            <div className="flex-grow">
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription dangerouslySetInnerHTML={{ __html: description }} />
                
            </div>
            {actionText && actionLink && (
                <Button
                    variant="link"
                    className={type === 'destructive' ? ' text-destructive-300' : 'text-primary-300'}
                    onClick={() => navigate(actionLink)}
                >
                    {actionText}
                </Button>
            )}
        </Alert>
    );
};

export default PlatformAlert;
