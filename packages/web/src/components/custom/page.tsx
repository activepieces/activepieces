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
            'flex w-full flex-1 flex-col gap-6',
            fill && 'min-h-0',
            width === 'narrow' && 'mx-auto max-w-3xl',
            className,
          )}
        >
          {children}
        </div>
      </div>
      {footer && (
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
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { label: React.ReactNode; to?: string; onClick?: () => void };
  children?: React.ReactNode;
  className?: string;
}) {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return <div data-slot="page-header" className="pt-6" />;
  }

  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex shrink-0 flex-col gap-1 pt-8 md:pt-12 xl:pt-16',
        className,
      )}
    >
      {back && <PageBackLink {...back} />}
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="min-w-0 text-3xl font-semibold tracking-tight text-gray-12">
          {title}
        </h1>
        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
      {description && (
        <div className="max-w-2xl text-base text-gray-11">{description}</div>
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
        'mt-4 flex flex-col gap-6 [[data-slot=page-header]+&]:mt-0',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <h2 className="text-xl font-semibold text-gray-12">{title}</h2>
            )}
            {description && (
              <div className="text-sm text-gray-11">{description}</div>
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

const PAGE_GUTTER = 'w-full px-4 md:px-6 xl:px-8';

export { Page, PageHeader, PageSection, Toolbar, ToolbarSpacer, PAGE_GUTTER };

type PageWidth = 'full' | 'narrow';
