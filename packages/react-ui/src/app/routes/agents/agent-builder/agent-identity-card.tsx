import { Activity, Wand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import { Agent } from '@activepieces/shared';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { agentsApi } from '../agents-api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AgentIdentityCardProps {
  agent?: Agent;
  refetch: () => void;
  onEditClick: () => void;
}

type AgentUpdateFields = {
  displayName?: string;
  description?: string;
};

export const AgentIdentityCard = ({
  agent,
  refetch,
  onEditClick,
}: AgentIdentityCardProps) => {
  const [displayName, setDisplayName] = useState(agent?.displayName || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const updateAgentMutation = useMutation({
    mutationFn: (fields: AgentUpdateFields) => {
      if (!agent?.id) return Promise.reject('No agent ID');
      return agentsApi.update(agent.id, fields);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleNameChange = async (value: string) => {
    setDisplayName(value);
    await updateAgentMutation.mutateAsync({ displayName: value });
  };

  const handleDescriptionChange = async (value: string) => {
    setDescription(value);
    await updateAgentMutation.mutateAsync({ description: value });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0">
          <img
            src={
              agent?.profilePictureUrl ||
              'https://cdn.activepieces.com/quicknew/agents/robots/robot_7000.png'
            }
            alt="Agent avatar"
            className="w-20 h-20 rounded-xl object-cover border"
          />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 justify-between">
            <EditableTextWithPen
              value={displayName}
              className="text-2xl font-semibold"
              readonly={false}
              onValueChange={handleNameChange}
              isEditing={isEditingName}
              setIsEditing={setIsEditingName}
            />
            <Button
              variant="neutral"
              size="sm"
              onClick={onEditClick}
              className="flex items-center gap-2"
            >
              <Wand className="h-4 w-4" />
              Edit Behaviour
            </Button>
          </div>
          <EditableTextWithPen
            value={description}
            className="text-sm text-muted-foreground mt-1"
            readonly={false}
            onValueChange={handleDescriptionChange}
            isEditing={isEditingDescription}
            setIsEditing={setIsEditingDescription}
          />
          <div className="flex items-center gap-2 mt-2">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">
              Task Completed: {agent?.taskCompleted}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        Use this agent inside your flows to automate tasks and make them work in the background for you.
      </div>
    </>
  );
}; 