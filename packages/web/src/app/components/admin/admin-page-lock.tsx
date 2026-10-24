import { createContext, ReactNode, useContext } from 'react';

export function useAdminPageLock() {
  return useContext(AdminPageLockContext);
}

export const AdminPageLockContext = createContext<AdminPageLock | null>(null);

export const AdminPageHeaderSlotContext =
  createContext<AdminPageHeaderSlot | null>(null);

type AdminPageHeaderSlot = {
  target: HTMLElement | null;
};

type AdminPageLock = {
  callout: ReactNode;
  claim: () => void;
};
