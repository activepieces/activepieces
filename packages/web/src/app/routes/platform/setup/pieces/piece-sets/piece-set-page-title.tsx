import { ReactNode } from 'react';

import { PageTitle } from '@/app/components/page-title';
import { pieceSetTerms } from '@/features/piece-sets';

export function PieceSetPageTitle({
  singular = false,
  children,
}: {
  singular?: boolean;
  children: ReactNode;
}) {
  const terms = pieceSetTerms.get();
  return (
    <PageTitle title={singular ? terms.titleSingular : terms.title}>
      {children}
    </PageTitle>
  );
}
