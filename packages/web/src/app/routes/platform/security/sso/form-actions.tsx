import { ReactNode } from 'react';

export const FormActions = ({
  children,
  trailing,
}: {
  children?: ReactNode;
  trailing?: ReactNode;
}) =>
  trailing ? (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
      {trailing}
    </div>
  ) : (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
