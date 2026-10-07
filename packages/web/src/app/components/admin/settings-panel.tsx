import { t } from 'i18next';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { adminSurface } from './admin-surface';

export function SettingsPanel({
  title,
  description,
  action,
  flush = false,
  className,
  children,
}: SettingsPanelProps) {
  const hasHeader = title !== undefined || action !== undefined;
  return (
    <section
      data-slot="settings-panel"
      className={cn(adminSurface.card, 'flex flex-col', className)}
    >
      {hasHeader && (
        <header
          className={cn(
            adminSurface.panelHeader,
            'flex items-start justify-between gap-4 p-5',
          )}
        >
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <h2 className="text-sm font-semibold text-gray-12">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-11">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </header>
      )}
      <div
        className={cn(
          'flex flex-col',
          flush ? cn('divide-y', adminSurface.divider) : 'gap-4 p-5',
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  icon,
  media,
  title,
  description,
  children,
  below,
  className,
  ...rest
}: SettingsRowProps) {
  return (
    <div
      data-slot="settings-row"
      className={cn('flex flex-col gap-4 px-5 py-4', className)}
      {...rest}
    >
      <div className="flex flex-wrap items-center gap-4">
        {media && <div className="flex shrink-0 items-center">{media}</div>}
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-gray-3 text-gray-12 [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </div>
        )}
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-12">
            {title}
          </div>
          {description && (
            <div className="text-sm text-gray-11">{description}</div>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
      {below}
    </div>
  );
}

export function DangerZone({ children }: { children: ReactNode }) {
  return (
    <SettingsPanel title={t('Danger zone')} flush>
      {children}
    </SettingsPanel>
  );
}

type SettingsPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

type SettingsRowProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  icon?: ReactNode;
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  below?: ReactNode;
};
