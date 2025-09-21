import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useEmbedMode } from '@/hooks/use-embed-mode';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  externalId?: string;
}

export const WorkspaceSwitcher: React.FC = () => {
  const { isEmbedMode } = useEmbedMode();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Hide in embed mode
  if (isEmbedMode) {
    return null;
  }

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => authenticationApi.getWorkspaces(),
  });

  const switchWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => authenticationApi.switchWorkspace({ workspaceId }),
    onSuccess: (response) => {
      // Save the new authentication response
      authenticationSession.saveResponse(response, false);
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: (error) => {
      console.error('Failed to switch workspace:', error);
    },
  });

  const handleWorkspaceSwitch = (workspaceId: string) => {
    switchWorkspaceMutation.mutate(workspaceId);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!workspaces?.workspaces || workspaces.workspaces.length <= 1) {
    return null; // Don't show switcher if there's only one workspace
  }

  const currentWorkspaceId = authenticationSession.getPlatformId();
  const currentWorkspace = workspaces.workspaces.find(w => w.id === currentWorkspaceId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {workspaces.workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSwitch(workspace.id)}
            disabled={switchWorkspaceMutation.isPending}
            className={workspace.id === currentWorkspaceId ? 'bg-accent' : ''}
          >
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate">{workspace.name}</span>
            {workspace.externalId && (
              <span className="text-xs text-muted-foreground ml-auto">
                {workspace.externalId}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
