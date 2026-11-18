import React from 'react';

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-12">{title}</span>
        {description && (
          <span className="text-xs text-gray-11">{description}</span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export const SETTING_TRIGGER_CLASS = 'w-40 justify-between font-normal';
