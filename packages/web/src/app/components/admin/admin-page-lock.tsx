import { createContext, ReactNode, useContext } from 'react';

export function useAdminPageLock() {
  return useContext(AdminPageLockContext);
}

export function AdminPageLockedPreview({ children }: { children: ReactNode }) {
  return (
    <AdminPageLockContext.Provider value={null}>
      <div
        inert
        aria-hidden
        data-slot="admin-page-lock-preview"
        className="pointer-events-none flex min-h-0 flex-1 select-none flex-col gap-6 opacity-50 grayscale mask-b-from-40%"
      >
        {children}
      </div>
    </AdminPageLockContext.Provider>
  );
}

export const AdminPageLockContext = createContext<AdminPageLock | null>(null);

export const AdminPageHeaderSlotContext =
  createContext<AdminPageHeaderSlot | null>(null);

export type AdminPageHeaderSlot = {
  target: HTMLElement | null;
};

export type AdminPageLock = {
  callout: ReactNode;
  claim: () => void;
};
