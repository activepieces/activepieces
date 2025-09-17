import { useEffect } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

type PageTitleProps = {
  title: string;
  children: React.ReactNode;
};

const PageTitle = ({ title, children }: PageTitleProps) => {
  const websiteBranding = flagsHooks.useWebsiteBranding();

  useEffect(() => {
    document.title = `${title} | ${websiteBranding.websiteName}`;
  }, [title, websiteBranding.websiteName]);

  return children;
};

PageTitle.displayName = 'PageTitle1';

export { PageTitle };
