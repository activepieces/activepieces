import { create } from 'zustand';

export const useEnterpriseTrialDesignStore = create<EnterpriseTrialDesignState>(
  (set) => ({
    endedBanner: false,
    setDesign: (patch) => set(patch),
  }),
);

type EnterpriseTrialDesignState = {
  endedBanner: boolean;
  setDesign: (
    patch: Partial<Pick<EnterpriseTrialDesignState, 'endedBanner'>>,
  ) => void;
};
