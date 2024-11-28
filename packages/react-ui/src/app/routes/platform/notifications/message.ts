export interface Message {
    id: string;
    title: string;
    description: string;
    actionText?: string;
    actionLink?: string;
    alert?: boolean;
    type?: 'default' | 'destructive';
}