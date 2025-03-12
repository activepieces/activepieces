import { Type, Calendar, Hash } from 'lucide-react';
import { ReactNode } from 'react';

import { FieldType } from '@activepieces/shared';

export function getColumnIcon(type: FieldType): ReactNode {
  switch (type) {
    case FieldType.TEXT:
      return <Type className="h-4 w-4" />;
    case FieldType.DATE:
      return <Calendar className="h-4 w-4" />;
    case FieldType.NUMBER:
      return <Hash className="h-4 w-4" />;
    default:
      return null;
  }
}
