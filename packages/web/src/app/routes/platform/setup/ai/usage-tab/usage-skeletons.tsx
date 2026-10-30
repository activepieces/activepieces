import {
  AI_USAGE_RELATED_DIMENSIONS,
  AI_USAGE_SOURCE_DIMENSIONS,
  AiUsageDimension,
} from '@activepieces/shared';

import { adminSurface, StatGrid } from '@/app/components/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { relatedSpan, USAGE_LIST_GRID } from './usage-bits';

export function UsageOverviewSkeleton() {
  return (
    <>
      <TilesSkeleton />
      <HeroSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <DonutCardSkeleton className="lg:col-span-8" />
        <ListCardSkeleton className="lg:col-span-4" />
        <ListCardSkeleton className="lg:col-span-4" />
        <ListCardSkeleton className="lg:col-span-4" />
        <ListCardSkeleton className="lg:col-span-4" />
        <ListCardSkeleton className="lg:col-span-6" />
        <ListCardSkeleton className="lg:col-span-6" />
      </div>
    </>
  );
}

export function UsageDetailSkeleton({
  dimension,
}: {
  dimension: AiUsageDimension;
}) {
  const related = AI_USAGE_RELATED_DIMENSIONS[dimension];
  return (
    <>
      <TilesSkeleton />
      <HeroSkeleton />
      {AI_USAGE_SOURCE_DIMENSIONS.includes(dimension) && <DonutCardSkeleton />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {related.map((other, index) => (
          <ListCardSkeleton
            key={other}
            className={relatedSpan({ index, count: related.length })}
          />
        ))}
      </div>
    </>
  );
}

export function UsageListSkeleton() {
  return (
    <section className={cn(adminSurface.card, 'flex flex-col')}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <Skeleton className="h-9 w-full rounded-lg sm:max-w-xs" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div
        className={cn(USAGE_LIST_GRID, 'border-y border-gray-6 px-5 py-2.5')}
      >
        <Skeleton className="h-3 w-12" />
        <Skeleton className="hidden h-3 w-12 justify-self-end md:block" />
        <Skeleton className="hidden h-3 w-10 justify-self-end md:block" />
        <Skeleton className="hidden h-3 w-12 justify-self-end md:block" />
        <Skeleton className="h-3 w-12 justify-self-end" />
        <span />
      </div>
      <ul className="flex flex-col divide-y divide-gray-6">
        {LIST_ROWS.map((row) => (
          <li key={row} className={cn(USAGE_LIST_GRID, 'px-5 py-3.5')}>
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-1 w-24 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="hidden h-3.5 w-10 justify-self-end md:block" />
            <Skeleton className="hidden h-3.5 w-12 justify-self-end md:block" />
            <Skeleton className="hidden h-3.5 w-10 justify-self-end md:block" />
            <Skeleton className="h-3.5 w-14 justify-self-end" />
            <Skeleton className="size-4 rounded-sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TilesSkeleton() {
  return (
    <StatGrid columns={3}>
      {TILES.map((tile) => (
        <div
          key={tile}
          className={cn(adminSurface.card, 'flex flex-col gap-3 p-5')}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </StatGrid>
  );
}

function HeroSkeleton() {
  return (
    <section className={cn(adminSurface.card, 'flex flex-col gap-5 p-5')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-lg" />
    </section>
  );
}

function DonutCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-4 p-5', className)}
    >
      <CardTitleSkeleton />
      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <Skeleton className="aspect-square w-full max-w-56 shrink-0 rounded-full" />
        <div className="flex w-full flex-col gap-4">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <CardTitleSkeleton />
      <ul className="flex flex-col gap-1">
        {ROWS.map((row) => (
          <li key={row} className="flex flex-col gap-1.5 py-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-14" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardTitleSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-3.5 w-12" />
    </div>
  );
}

const TILES = ['pace', 'calls', 'tokens'];
const ROWS = ['a', 'b', 'c', 'd', 'e'];
const LIST_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
