import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'error' | 'default';

export interface StatusConfig {
  variant: StatusVariant;
  text: string;
  icon: any;
}

export const getIssueStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case 'resolved':
      return { variant: 'success', text: normalizedStatus, icon: CheckCircle };
    case 'unresolved':
      return { variant: 'error', text: normalizedStatus, icon: AlertTriangle };
    default:
      return { variant: 'default', text: normalizedStatus, icon: Info };
  }
};
