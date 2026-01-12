// Stub for removed alerts feature (EE feature)
import { useQuery, useMutation } from '@tanstack/react-query';

// Stub type for alert data
interface AlertEmail {
  id: string;
  receiver: string;
  projectId: string;
  created: string;
  updated: string;
}

export const alertQueries = {
  useAlerts: () => {
    return useQuery({
      queryKey: ['alerts'],
      queryFn: async (): Promise<AlertEmail[]> => [],
    });
  },
  useAlertsEmailList: () => {
    return useQuery({
      queryKey: ['alerts-email-list'],
      queryFn: async (): Promise<AlertEmail[]> => [],
    });
  },
};

export const alertMutations = {
  useCreateAlert: (_params?: unknown) => {
    return useMutation({
      mutationFn: async (_request: unknown) => {},
    });
  },
  useDeleteAlert: () => {
    return useMutation({
      mutationFn: async (_alert: AlertEmail) => {},
    });
  },
};
