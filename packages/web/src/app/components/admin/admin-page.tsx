import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

import { AdminResource, AdminResources } from './admin-resources';
import { adminSurface } from './admin-surface';

if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
  Object.values(import.meta.glob('./dev-surface-tuner.ts')).forEach((load) =>
    load().catch(() => undefined),
  );
}

export function AdminPage({
  width = 'full',
  fill = false,
  footer,
  className,
  children,
}: AdminPageProps) {
  return (
    <div
      data-slot="admin-page"
      className={cn(
        adminSurface.page,
        'flex w-full flex-col',
        fill ? 'h-full min-h-0' : 'flex-1',
      )}
    >
      <div
        className={cn(
          'flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-6',
          fill && 'min-h-0',
          WIDTH_CLASS[width],
          className,
        )}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  back,
  badge,
  resources,
  children,
}: AdminPageHeaderProps) {
  const { embedState } = useEmbedding();
  if (embedState.hidePageHeader) {
    return null;
  }
  const hasResources = resources !== undefined && resources.length > 0;

  return (
    <header
      data-slot="admin-page-header"
      className={cn(adminSurface.header, 'flex shrink-0 flex-col gap-2')}
    >
      {back && (
        <Link
          to={back.to}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-11 hover:text-gray-12"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {typeof title === 'string' ? (
            <h1 className="text-2xl font-semibold tracking-tight text-gray-12">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge}
        </div>
        {(hasResources || children) && (
          <div className="flex flex-wrap items-center gap-2">
            {hasResources && <AdminResources resources={resources} />}
            {children}
          </div>
        )}
      </div>
      {description && (
        <div className="max-w-3xl text-sm text-gray-11">{description}</div>
      )}
    </header>
  );
}

export function AdminSection({
  title,
  description,
  action,
  className,
  children,
}: AdminSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <h2 className="text-base font-semibold text-gray-12">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-11">{description}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const WIDTH_CLASS: Record<AdminPageWidth, string> = {
  full: '',
  medium: 'mx-auto max-w-4xl',
  narrow: 'mx-auto max-w-160',
};

type AdminPageWidth = 'full' | 'medium' | 'narrow';

type AdminPageProps = {
  width?: AdminPageWidth;
  fill?: boolean;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  back?: { label: string; to: string };
  badge?: ReactNode;
  resources?: AdminResource[];
  children?: ReactNode;
};

type AdminSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};
