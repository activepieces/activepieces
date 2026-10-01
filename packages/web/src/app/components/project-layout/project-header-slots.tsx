import * as React from 'react';
import { createPortal } from 'react-dom';

function ProjectHeaderSlotsProvider({
  inHeader,
  children,
}: {
  inHeader: boolean;
  children: React.ReactNode;
}) {
  const [actions, setActions] = React.useState<HTMLElement | null>(null);
  const [meta, setMeta] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(
    () => ({ inHeader, actions, meta, setActions, setMeta }),
    [inHeader, actions, meta],
  );
  return (
    <ProjectHeaderSlotsContext.Provider value={value}>
      {children}
    </ProjectHeaderSlotsContext.Provider>
  );
}

function ProjectHeaderActionsSlot() {
  const slots = React.useContext(ProjectHeaderSlotsContext);
  return (
    <div
      ref={slots?.setActions}
      data-slot="project-header-actions"
      className="flex items-center gap-2 empty:hidden"
    />
  );
}

function ProjectHeaderMetaSlot() {
  const slots = React.useContext(ProjectHeaderSlotsContext);
  return (
    <div
      ref={slots?.setMeta}
      data-slot="project-header-meta"
      className="max-w-2xl text-sm text-gray-11 empty:hidden"
    />
  );
}

function ProjectHeaderActions({ children }: { children: React.ReactNode }) {
  const slots = React.useContext(ProjectHeaderSlotsContext);
  if (!slots || !slots.inHeader) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
      </div>
    );
  }
  if (!slots.actions) {
    return null;
  }
  return createPortal(children, slots.actions);
}

function ProjectHeaderMeta({ children }: { children: React.ReactNode }) {
  const slots = React.useContext(ProjectHeaderSlotsContext);
  if (!slots?.inHeader || !slots.meta) {
    return null;
  }
  return createPortal(children, slots.meta);
}

const ProjectHeaderSlotsContext =
  React.createContext<ProjectHeaderSlots | null>(null);

export {
  ProjectHeaderActions,
  ProjectHeaderActionsSlot,
  ProjectHeaderMeta,
  ProjectHeaderMetaSlot,
  ProjectHeaderSlotsProvider,
};

type ProjectHeaderSlots = {
  inHeader: boolean;
  actions: HTMLElement | null;
  meta: HTMLElement | null;
  setActions: (node: HTMLElement | null) => void;
  setMeta: (node: HTMLElement | null) => void;
};
