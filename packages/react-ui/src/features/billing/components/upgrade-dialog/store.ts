import { create } from 'zustand';

import { PlatformUsageMetric } from '@activepieces/shared';

interface ManagePlanDialogState {
  isOpen: boolean;
  metric?: PlatformUsageMetric;
  title?: string;
}

interface ManagePlanDialogStore {
  dialog: ManagePlanDialogState;
  openDialog: (params?: {
    metric?: PlatformUsageMetric;
    title?: string;
  }) => void;
  closeDialog: () => void;
}

export const useManagePlanDialogStore = create<ManagePlanDialogStore>(
  (set) => ({
    dialog: {
      isOpen: false,
      metric: undefined,
      title: undefined,
    },
    openDialog: (params = {}) =>
      set((state) => ({
        dialog: {
          isOpen: true,
          metric: params.metric,
          title: params.title,
        },
      })),
    closeDialog: () =>
      set((state) => ({
        dialog: {
          isOpen: false,
          metric: undefined,
          title: undefined,
        },
      })),
  }),
);
