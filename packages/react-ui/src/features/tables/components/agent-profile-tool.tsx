import { agentHooks, agentRunHooks } from '@/features/agents/lib/agent-hooks';
import { AgentRun, ContentBlockType, isNil } from '@activepieces/shared';

type AgentProfileToolProps = {
  agentRunId: string | null | undefined;
};

const AgentProfileTool = ({ agentRunId }: AgentProfileToolProps) => {
  const { data: agentRun } = agentRunHooks.useGet(agentRunId);
  const { data: agent } = agentHooks.useGet(agentRun?.agentId);

  if (isNil(agentRun) || isNil(agent)) {
    return null;
  }

  const getLogoUrl = (agentRun: AgentRun) => {
    const lastStep = agentRun.steps[agentRun.steps.length - 1];
    if (
      lastStep?.type === ContentBlockType.TOOL_CALL &&
      'logoUrl' in lastStep
    ) {
      return lastStep.logoUrl;
    }
    return undefined;
  };

  return (
    <div className="w-full flex-shrink-0 p-1 flex flex-col items-center justify-center">
      <div className="side-gradient-wrapper">
        <div className="side-gradient-big sticky left-0"></div>
        <div className="side-gradient-small sticky left-0"></div>
      </div>
      <div className="w-7 flex flex-col items-center justify-center p-0.5 ring ring-black/10 rounded-xs">
        <img
          src={getLogoUrl(agentRun) ?? agent?.profilePictureUrl}
          alt="Tool logo"
          className="rounded-xs w-full h-full object-contain animate-tool-pop min-w-2 min-h-2"
        />
        <div className="tool-loading-indicator"></div>
      </div>
    </div>
  );
};

export { AgentProfileTool };
