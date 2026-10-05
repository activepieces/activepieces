import * as React from 'react';

export function SheetSaveForm({ onSubmit, children }: SheetSaveFormProps) {
  return (
    <form
      className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      {children}
    </form>
  );
}

export type SheetSaveFormProps = {
  onSubmit: () => unknown;
  children: React.ReactNode;
};
