import { Project, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProjectName } from '@/features/projects';

export const NewBlankAgentButton = ({
  projects,
  pending,
  onCreate,
  variant = 'outline',
  size,
  className,
  icon,
  label,
}: NewBlankAgentButtonProps) => {
  const personalProject = projects.find(
    (project) => project.type === ProjectType.PERSONAL,
  );

  if (personalProject !== undefined) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        loading={pending}
        onClick={() => onCreate(personalProject.id)}
      >
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          loading={pending}
        >
          {icon}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('Create it in')}
        </DropdownMenuLabel>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => onCreate(project.id)}
          >
            {getProjectName(project)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type NewBlankAgentButtonProps = {
  projects: Project[];
  pending: boolean;
  onCreate: (projectId: string) => void;
  variant?: 'outline';
  size?: 'sm';
  className?: string;
  icon: ReactNode;
  label: string;
};
