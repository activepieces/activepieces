import { ReactNode } from 'react';

import { PieceIcon } from '@/features/pieces';

export function RequiredActionGroupHeader({
  displayName,
  logoUrl,
  children,
}: {
  displayName: string;
  logoUrl: string | undefined;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <PieceIcon
        size="sm"
        border={true}
        displayName={displayName}
        logoUrl={logoUrl}
        showTooltip={false}
      />
      <span className="flex-1 text-sm font-medium text-gray-12">
        {displayName}
      </span>
      {children}
    </div>
  );
}
