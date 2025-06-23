import { ReactNode, useState } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { projectHooks } from '@/hooks/project-hooks';
import { ProjectReleaseType } from '@activepieces/shared';

import { ProjectSelectionDialog } from './selection-release-dialog/project-dialog';

type SelectionButtonProps = ButtonProps & {
  ReleaseType: ProjectReleaseType;
  children: ReactNode;
  onSuccess: () => void;
  defaultName?: string;
};
export function SelectionButton({
  ReleaseType,
  children,
  onSuccess,
  defaultName,
  ...props
}: SelectionButtonProps) {
  const { project } = projectHooks.useCurrentProject();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        {...props}
        onClick={() => {
          setOpen(true);
        }}
      >
        {children}
      </Button>
      {ReleaseType === ProjectReleaseType.PROJECT && (
        <ProjectSelectionDialog
          open={open}
          setOpen={setOpen}
          projectId={project.id}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
