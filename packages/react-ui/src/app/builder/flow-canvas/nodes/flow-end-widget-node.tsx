import { Handle, Position } from '@xyflow/react';
import { t } from 'i18next';
import { useRef } from 'react';

import { flowUtilConsts } from '../utils/consts';
import { ApGraphEndNode } from '../utils/types';

const ApGraphEndWidgetNode = ({ data }: Omit<ApGraphEndNode, 'position'>) => {
  const elementRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div className="h-[1px] w-[1px] relative">
        {data.showWidget && (
          <div
            ref={elementRef}
            style={{ left: `-${(elementRef.current?.clientWidth || 0) / 2}px` }}
            className="px-2.5 absolute  py-1.5 bg-accent text-foreground/70 rounded-full animate-fade"
            key={'flow-end-button'}
          >
            {t('End')}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={flowUtilConsts.HANDLE_STYLING}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={flowUtilConsts.HANDLE_STYLING}
      />
    </>
  );
};

ApGraphEndWidgetNode.displayName = 'ApGraphEndWidgetNode';
export default ApGraphEndWidgetNode;
