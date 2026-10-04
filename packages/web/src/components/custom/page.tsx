import { ChevronLeft } from 'lucide-react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

function Page({
  width = 'full',
  fill = false,
  footer,
  className,
  children,
}: {
  width?: PageWidth;
  fill?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const lock = React.useContext(PageLockContext);
  const claim = lock?.claim;
  React.useLayoutEffect(() => claim?.(), [claim]);
  return (
    <div
      data-slot="page"
      className={cn('flex flex-col', fill ? 'h-full min-h-0' : 'min-h-full')}
    >
      <div
        className={cn(
          PAGE_GUTTER,
          'flex flex-1 flex-col',
          fill ? 'min-h-0 pb-6' : 'pb-12',
        )}
      >
        <div
          data-width={width}
          className={cn(
            'flex w-full flex-1 flex-col gap-4 pt-6 has-[>[data-slot=page-header]:first-child]:pt-0',
            fill && 'min-h-0',
            width === 'narrow' && 'mx-auto max-w-3xl',
            className,
          )}
        >
          {lock ? <LockedPageContent>{children}</LockedPageContent> : children}
        </div>
      </div>
      {footer && !lock && (
        <div
          data-slot="page-footer"
          className={cn(PAGE_GUTTER, 'sticky bottom-0 border-t bg-gray-1 py-3')}
        >
          <div
            className={cn(
              'flex w-full items-center justify-end gap-2',
              width === 'narrow' && 'mx-auto max-w-3xl',
            )}
          >
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  title,
  description,
  back,
  badge,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { label: React.ReactNode; to?: string; onClick?: () => void };
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { embedState } = useEmbedding();
  const lock = React.useContext(PageLockContext);
  const actions = lock ? null : children;

  if (embedState.hidePageHeader) {
    return <div data-slot="page-header" className="pt-6" />;
  }

  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex shrink-0 flex-col gap-1 pt-6 md:pt-8 xl:pt-10',
        className,
      )}
    >
      {back && <PageBackLink {...back} />}
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-gray-12">
            {title}
          </h1>
          {badge}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {description && !lock && (
        <div className="max-w-2xl text-sm text-gray-11">{description}</div>
      )}
    </header>
  );
}

function PageBackLink({
  label,
  to,
  onClick,
}: {
  label: React.ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const className =
    'mb-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-11 outline-hidden hover:text-gray-12 focus-visible:text-gray-12 [&_svg]:size-4';
  if (to) {
    return (
      <Link to={to} className={className}>
        <ChevronLeft />
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <ChevronLeft />
      {label}
    </button>
  );
}

function PageSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-slot="page-section"
      className={cn(
        'mt-4 flex flex-col gap-4 [[data-slot=page-header]+&]:mt-0',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <h2 className="text-base font-semibold text-gray-12">{title}</h2>
            )}
            {description && (
              <div className="text-xs text-gray-11">{description}</div>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

function PageLock({
  callout,
  children,
}: Omit<PageLockValue, 'claim'> & { children: React.ReactNode }) {
  const [claims, setClaims] = React.useState(0);
  const claim = React.useCallback(() => {
    setClaims((count) => count + 1);
    return () => setClaims((count) => count - 1);
  }, []);
  return (
    <PageLockContext.Provider value={{ callout, claim }}>
      {claims === 0 && (
        <div className={cn(PAGE_GUTTER, 'pt-6 md:pt-8 xl:pt-10')}>
          {callout({ underPageTitle: false })}
        </div>
      )}
      {children}
    </PageLockContext.Provider>
  );
}

function LockedPageContent({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const headerIndex = items.findIndex(
    (item) => React.isValidElement(item) && item.type === PageHeader,
  );
  const lock = React.useContext(PageLockContext);
  const header = headerIndex === -1 ? null : items[headerIndex];
  const kept = items.filter(
    (item, index) => index !== headerIndex && staysLiveWhenLocked(item),
  );
  const rest = items.filter(
    (item, index) => index !== headerIndex && !staysLiveWhenLocked(item),
  );
  return (
    <>
      {header}
      {kept}
      {lock?.callout({ underPageTitle: header !== null })}
      <PageLockContext.Provider value={null}>
        <div
          inert
          aria-hidden
          className="pointer-events-none flex min-h-0 flex-1 flex-col gap-4 pt-2 opacity-60 saturate-50 select-none mask-b-from-55%"
        >
          {rest}
        </div>
      </PageLockContext.Provider>
    </>
  );
}

function staysLiveWhenLocked(item: React.ReactNode): boolean {
  return (
    React.isValidElement(item) &&
    typeof item.type === 'function' &&
    PAGE_LOCK_KEEP in item.type
  );
}

function PageColumns({
  main,
  aside,
  className,
}: {
  main: React.ReactNode;
  aside: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="page-columns"
      className={cn(
        'grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">{main}</div>
      <aside className="flex min-w-0 flex-col gap-4">{aside}</aside>
    </div>
  );
}

function Toolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="toolbar"
      className={cn('flex flex-wrap items-center gap-3', className)}
      {...props}
    />
  );
}

function ToolbarSpacer() {
  return <div aria-hidden className="flex-1" />;
}

const PAGE_GUTTER = 'w-full px-3 md:px-6 xl:px-8';

const PAGE_LOCK_KEEP = 'keepWhenPageLocked';

const PageLockContext = React.createContext<PageLockValue | null>(null);

export {
  Page,
  PageHeader,
  PageColumns,
  PageLock,
  PageSection,
  Toolbar,
  ToolbarSpacer,
  PAGE_GUTTER,
  PAGE_LOCK_KEEP,
};

type PageWidth = 'full' | 'narrow';

type PageLockValue = {
  callout: (placement: { underPageTitle: boolean }) => React.ReactNode;
  claim: () => () => void;
};
