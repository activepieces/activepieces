import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function AiCenterTrail({
  crumbs,
  current,
}: {
  crumbs: { label: string; to: string }[];
  current: string;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-2 text-2xl font-semibold tracking-tight sm:gap-2">
        {crumbs.map((crumb) => (
          <Fragment key={crumb.to}>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="rounded-md text-gray-11 hover:text-gray-12 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
              >
                <Link to={crumb.to}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="font-normal text-gray-8">
              /
            </BreadcrumbSeparator>
          </Fragment>
        ))}
        <BreadcrumbItem className="min-w-0">
          <h1 aria-current="page" className="min-w-0 break-words text-gray-12">
            {current}
          </h1>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
