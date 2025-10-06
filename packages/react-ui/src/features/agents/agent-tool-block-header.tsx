import { Loader2, Wrench, CircleCheck, CircleX } from 'lucide-react';
import React from 'react';

interface AgentToolBlockHeaderProps {
  metadata?: { logoUrl?: string; displayName?: string };
  isLoading: boolean;
  isDone: boolean;
  markAsComplete: boolean;
}

export const AgentToolBlockHeader: React.FC<AgentToolBlockHeaderProps> = ({
  metadata,
  isLoading,
  isDone,
  markAsComplete,
}) => (
  <div className="flex items-center gap-2 w-full">
    {isDone ? (
      markAsComplete ? (
        <CircleCheck className="h-4 w-4 text-green-700 shrink-0" />
      ) : (
        <CircleX className="h-4 w-4 text-red-700 shrink-0" />
      )
    ) : (
      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
    )}
    {isLoading ? (
      <div className="h-5 w-5 shrink-0">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ) : metadata?.logoUrl ? (
      <img
        src={metadata.logoUrl}
        alt="Logo"
        className="h-5 w-5 object-contain shrink-0"
      />
    ) : (
      <div className="h-5 w-5 shrink-0">
        <Wrench className="h-5 w-5" />
      </div>
    )}
    <span className="flex gap-1 items-center">
      <span className="text-sm text-muted-foreground">Using Tool:</span>
      <span className="text-sm font-semibold">
        {isLoading ? 'Loading...' : metadata?.displayName ?? 'Unknown Tool'}
      </span>
    </span>
  </div>
);
