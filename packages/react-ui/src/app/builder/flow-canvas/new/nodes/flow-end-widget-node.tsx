import { Handle, Position } from '@xyflow/react';
import { t } from 'i18next';
import { useRef } from 'react';
import { flowUtilConsts } from '../consts';
import { ApGraphEndNode } from '../types';

const ApGraphEndWidgetNode = ({
  id,
  data,
}: Exclude<ApGraphEndNode, 'position'>) => {
  const elementRef = useRef<HTMLDivElement>(null);
  return (
    <>
      {data.showWidget ? (
        <div
          ref={elementRef}
          style={{
            marginLeft: `-${(elementRef.current?.clientWidth || 0) / 2}px`,
          }}
          className="px-2.5   py-1.5 bg-accent text-foreground/70 rounded-full animate-fade"
          key={'flow-end-button'}
        >
          {t('End')}
        </div>
      ) : (
        <div className="h-[1px] w-[1px]"> {id}</div>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

ApGraphEndWidgetNode.displayName = 'ApGraphEndWidgetNode';
export default ApGraphEndWidgetNode;
