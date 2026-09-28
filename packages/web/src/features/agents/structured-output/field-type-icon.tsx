import { AgentOutputFieldType } from '@activepieces/shared';
import {
  CheckmarkSquare01Icon,
  HashIcon,
  TextIcon,
} from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';

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
      return <HugeiconsIcon icon={TextIcon} className={className} />;
    case AgentOutputFieldType.NUMBER:
      return <HugeiconsIcon icon={HashIcon} className={className} />;
    case AgentOutputFieldType.BOOLEAN:
      return (
        <HugeiconsIcon icon={CheckmarkSquare01Icon} className={className} />
      );
    default:
      return null;
  }
};
