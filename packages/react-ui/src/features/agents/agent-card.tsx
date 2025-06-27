import { Pencil, Activity } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import { AgentCardMenu } from './agent-card-menu';

interface AgentCardProps {
  picture: string;
  title: string;
  description: string;
  taskCompleted: number;
  onDelete?: () => Promise<void>;
  onDescriptionChange?: (newDescription: string) => Promise<void>;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  picture,
  title,
  description,
  taskCompleted,
  onDelete,
  onDescriptionChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);

  const handleSave = async () => {
    if (onDescriptionChange) {
      await onDescriptionChange(editedDescription);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col">
      <Card className="w-full h-[125px] cursor-pointer hover:border-gray-400 transition-colors duration-200 flex flex-col justify-between">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <img
                  src={picture}
                  alt={title}
                  className="w-full h-full rounded-sm object-cover"
                />
              </div>
            </div>
            <div className="flex-grow flex flex-col gap-0 min-w-0">
              <div className="flex justify-between items-center">
                <h2 className="truncate font-semibold text-lg line-clamp-1">
                  {title}
                </h2>
                <div className="flex items-center gap-2">
                  {onDescriptionChange && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <AgentCardMenu onDelete={onDelete} agentName={title} />
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="flex gap-2 items-start">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="text-sm min-h-[60px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="text-left text-sm text-muted-foreground overflow-hidden line-clamp-2 min-h-[2.5em]">
                  {description}
                </div>
              )}
              <div className="flex items-center gap-1 mt-2">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-xs font-medium">
                  Task Completed: {taskCompleted}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
