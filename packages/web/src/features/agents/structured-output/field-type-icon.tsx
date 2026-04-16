import { AgentOutputFieldType } from '@activepieces/shared';
import {
  CheckSquare as BooleanIcon,
  Hash as NumberIcon,
  Type as TextIcon,
} from 'lucide-react';

interface FieldTypeIconProps {
  type: AgentOutputFieldType;
  className?: string;
}

export const FieldTypeIcon = ({
  type,
  className = 'h-4 w-4',
}: FieldTypeIconProps) => {
  switch (type) {
    case AgentOutputFieldType.TEXT:
      return <TextIcon className={className} />;
    case AgentOutputFieldType.NUMBER:
      return <NumberIcon className={className} />;
    case AgentOutputFieldType.BOOLEAN:
      return <BooleanIcon className={className} />;
    default:
      return null;
  }
};
