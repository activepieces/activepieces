import { create } from 'zustand';

import { PlatformUsageMetric } from '@activepieces/shared';

interface ManagePlanDialogState {
  isOpen: boolean;
  metric?: PlatformUsageMetric;
  title?: string;
  step?: number;
}

interface ManagePlanDialogStore {
  dialog: ManagePlanDialogState;
  openDialog: (params?: {
    step?: number;
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
      step: undefined,
    },
    openDialog: (params = {}) =>
      set((state) => ({
        dialog: {
          isOpen: true,
          metric: params.metric,
          title: params.title,
          step: params.step,
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
