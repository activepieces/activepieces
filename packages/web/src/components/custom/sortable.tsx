import type {
  DndContextProps,
  DraggableSyntheticListeners,
  DropAnimation,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  type SortableContextProps,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { composeRefs } from '@/lib/compose-refs';
import { cn } from '@/lib/utils';

const orientationConfig = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
  },
};

interface SortableProps<TData extends { id: UniqueIdentifier }>
  extends DndContextProps {
  value: TData[];
  onValueChange?: (items: TData[]) => void;
  onMove?: (event: { activeIndex: number; overIndex: number }) => void;
  collisionDetection?: DndContextProps['collisionDetection'];
  modifiers?: DndContextProps['modifiers'];
  strategy?: SortableContextProps['strategy'];
  orientation?: 'vertical' | 'horizontal' | 'mixed';
  overlay?: React.ReactNode | null;
}

function Sortable<TData extends { id: UniqueIdentifier }>({
  value,
  onValueChange,
  collisionDetection = closestCenter,
  modifiers,
  strategy,
  onMove,
  orientation = 'vertical',
  overlay,
  children,
  ...props
}: SortableProps<TData>) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const config = orientationConfig[orientation];

  return (
    <DndContext
      modifiers={modifiers ?? config.modifiers}
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over?.id) {
          const activeIndex = value.findIndex((item) => item.id === active.id);
          const overIndex = value.findIndex((item) => item.id === over.id);

          if (onMove) {
            onMove({ activeIndex, overIndex });
          } else {
            onValueChange?.(arrayMove(value, activeIndex, overIndex));
          }
        }
        setActiveId(null);
      }}
      onDragCancel={() => setActiveId(null)}
      collisionDetection={collisionDetection}
      {...props}
    >
      <SortableContext items={value} strategy={strategy ?? config.strategy}>
        {children}
      </SortableContext>
      {overlay ? (
        <SortableOverlay activeId={activeId}>{overlay}</SortableOverlay>
      ) : null}
    </DndContext>
  );
}

const dropAnimationOpts: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

interface SortableOverlayProps
  extends React.ComponentPropsWithRef<typeof DragOverlay> {
  activeId?: UniqueIdentifier | null;
}

const SortableOverlay = React.forwardRef<HTMLDivElement, SortableOverlayProps>(
  (
    { activeId, dropAnimation = dropAnimationOpts, children, ...props },
    ref,
  ) => {
    return (
      <DragOverlay dropAnimation={dropAnimation} {...props}>
        {activeId ? (
          <SortableItem
            ref={ref}
            value={activeId}
            className="cursor-grabbing"
            asChild
          >
            {children}
          </SortableItem>
        ) : null}
      </DragOverlay>
    );
  },
);
SortableOverlay.displayName = 'SortableOverlay';

interface SortableItemContextProps {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
}

const SortableItemContext = React.createContext<SortableItemContextProps>({
  attributes: {},
  listeners: undefined,
  isDragging: false,
});

function useSortableItem() {
  const context = React.useContext(SortableItemContext);

  if (!context) {
    throw new Error('useSortableItem must be used within a SortableItem');
  }

  return context;
}
function SortableItem({
  value,
  asTrigger,
  asChild,
  className,
  ref,
  ...props
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value });

  const context = React.useMemo<SortableItemContextProps>(
    () => ({
      attributes,
      listeners,
      isDragging,
    }),
    [attributes, listeners, isDragging],
  );
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const Comp = asChild ? Slot.Root : 'div';

  return (
    <SortableItemContext.Provider value={context}>
      <Comp
        data-state={isDragging ? 'dragging' : undefined}
        className={cn(
          'data-[state=dragging]:cursor-grabbing',
          { 'cursor-grab': !isDragging && asTrigger },
          className,
        )}
        ref={composeRefs(ref, setNodeRef as React.Ref<HTMLDivElement>)}
        style={style}
        {...(asTrigger ? attributes : {})}
        {...(asTrigger ? listeners : {})}
        {...props}
      />
    </SortableItemContext.Provider>
  );
}

function SortableDragHandle({
  className,
  ref,
  ...props
}: SortableDragHandleProps) {
  const { attributes, listeners, isDragging } = useSortableItem();

  return (
    <Button
      ref={composeRefs(ref)}
      data-state={isDragging ? 'dragging' : undefined}
      className={cn(
        'cursor-grab data-[state=dragging]:cursor-grabbing',
        className,
      )}
      type="button"
      {...attributes}
      {...listeners}
      {...props}
    />
  );
}

export { Sortable, SortableDragHandle, SortableItem, SortableOverlay };

interface SortableItemProps extends React.ComponentProps<'div'> {
  value: UniqueIdentifier;
  asTrigger?: boolean;
  asChild?: boolean;
}

interface SortableDragHandleProps extends ButtonProps {
  withHandle?: boolean;
}
