import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { LockKeyhole } from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';

import { Header } from './header';
type Link = {
  icon: React.ReactNode;
  label: string;
  to: string;
  notification?: boolean;
};

type CustomTooltipLinkProps = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  extraClasses?: string;
  notification?: boolean;
  locked?: boolean;
};
const CustomTooltipLink = ({
  to,
  label,
  Icon,
  extraClasses,
  notification,
  locked,
}: CustomTooltipLinkProps) => {
  const location = useLocation();

  const isActive = location.pathname.startsWith(to);

  return (
    <Link to={to}>
      <div
        className={`relative flex flex-col items-center justify-center gap-1`}
      >
        {locked && (
          <LockKeyhole
            className="absolute right-[-1px] bottom-[20px] size-3"
            color="grey"
          />
        )}
        <Icon
          className={`size-10 p-2.5 hover:text-primary rounded-lg transition-colors ${
            isActive ? 'bg-accent text-primary' : ''
          } ${extraClasses || ''}`}
        />
        <span className="text-[10px]">{label}</span>
        {notification && (
          <span className="bg-destructive absolute right-[-3px] top-[-3px] size-2 rounded-full"></span>
        )}
      </div>
    </Link>
  );
};

export type SidebarLink = {
  to: string;
  label: string;
  icon: React.ElementType;
  notification?: boolean;
  locked?: boolean;
};

type SidebarProps = {
  children: React.ReactNode;
  links: SidebarLink[];
};
export function Sidebar({ children, links }: SidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const branding = flagsHooks.useWebsiteBranding(queryClient);

  return (
    <div className="flex min-h-screen w-full  ">
      <aside className=" border-r sticky  top-0 h-screen bg-muted/50 w-[65px] ">
        <ScrollArea>
          <nav className="flex flex-col items-center h-screen  sm:py-5  gap-5 p-2 ">
            <div
              className="h-[48px] items-center justify-center cursor-pointer"
              onClick={() => navigate('/flows')}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/">
                    <img
                      src={branding.logos.logoIconUrl}
                      alt={t('logo')}
                      width={28}
                      height={28}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {branding.websiteName}
                </TooltipContent>
              </Tooltip>
            </div>
            {links.map((link, index) => (
              <CustomTooltipLink
                to={link.to}
                label={link.label}
                Icon={link.icon}
                key={index}
                locked={link.locked}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>
      <div className="flex-1 p-4">
        <div className="flex flex-col">
          <Header />
          <div className="container mx-auto flex py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
