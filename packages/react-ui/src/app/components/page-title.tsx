import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

type PageTitleProps = {
  title: string;
  children: React.ReactNode;
};

const PageTitle = ({ title, children }: PageTitleProps) => {
  const queryClient = useQueryClient();
  const websiteBranding = flagsHooks.useWebsiteBranding(queryClient);

  useEffect(() => {
    document.title = `${title} | ${websiteBranding.websiteName}`;
  }, [title, websiteBranding.websiteName]);

  return children;
};

PageTitle.displayName = 'PageTitle';

export { PageTitle };
