import { Link, useLocation } from 'react-router-dom';

import { buttonVariants } from '../../components/ui/button';

import { cn } from '@/lib/utils';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

export function ProjectSettingsSidebarItem({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            location.pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start',
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {item.icon}
            {item.title}
          </div>
        </Link>
      ))}
    </nav>
  );
}
