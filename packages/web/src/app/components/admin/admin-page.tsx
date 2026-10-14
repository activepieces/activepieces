import { ArrowLeft } from 'lucide-react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { billingDialogHooks } from '@/features/billing';
import { MenuFocusReturnScope } from '@/hooks/use-menu-focus-return';
import { PLAN_LIMIT_EVENT } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

import { adminLayout } from './admin-layout';
import { AdminResource, AdminResources } from './admin-resources';
import { adminSurface } from './admin-surface';

export function AdminPage({
  width = 'full',
  fill = false,
  footer,
  className,
  children,
}: AdminPageProps) {
  const [footerSlot, setFooterSlot] = useState<HTMLDivElement | null>(null);
  const footerContext = { inPage: true, slot: footerSlot };
  useEffect(() => {
    const openPlanDialog = () =>
      billingDialogHooks.useManagePlanDialogStore.getState().openDialog();
    window.addEventListener(PLAN_LIMIT_EVENT, openPlanDialog);
    return () => window.removeEventListener(PLAN_LIMIT_EVENT, openPlanDialog);
  }, []);
  return (
    <MenuFocusReturnScope>
      <AdminPageFooterContext.Provider value={footerContext}>
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
          <div ref={setFooterSlot} className="contents" />
        </div>
      </AdminPageFooterContext.Provider>
    </MenuFocusReturnScope>
  );
}

export function AdminPageFooter({ children }: { children: ReactNode }) {
  const { inPage, slot } = useContext(AdminPageFooterContext);
  if (!inPage) {
    return children;
  }
  return slot ? createPortal(children, slot) : null;
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
  const hasResources =
    !embedState.isEmbedded && resources !== undefined && resources.length > 0;
  if (embedState.hidePageHeader) {
    if (!back && !children) {
      return null;
    }
    return (
      <div
        data-slot="admin-page-actions"
        className="flex shrink-0 flex-wrap items-center justify-between gap-2"
      >
        {back && <AdminBackLink back={back} />}
        {children && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <header
      data-slot="admin-page-header"
      className="flex shrink-0 flex-col gap-2"
    >
      {back && <AdminBackLink back={back} />}
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {typeof title === 'string' ? (
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-gray-12">
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

function AdminBackLink({ back }: { back: AdminPageBack }) {
  return (
    <Link
      to={back.to}
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-11 hover:text-gray-12"
    >
      <ArrowLeft className="size-4" />
      {back.label}
    </Link>
  );
}

const AdminPageFooterContext = createContext<{
  inPage: boolean;
  slot: HTMLDivElement | null;
}>({ inPage: false, slot: null });

const WIDTH_CLASS: Record<AdminPageWidth, string> = {
  full: '',
  content: adminLayout.contentWidth,
};

type AdminPageBack = { label: string; to: string };

type AdminPageWidth = 'full' | 'content';

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
  back?: AdminPageBack;
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
