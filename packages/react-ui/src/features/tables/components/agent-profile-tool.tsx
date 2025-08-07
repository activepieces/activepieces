import ImageWithFallback from '@/components/ui/image-with-fallback';
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
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <ImageWithFallback
          src={agent?.profilePictureUrl}
          alt={agent?.displayName}
          className="size-6 rounded-full"
        ></ImageWithFallback>
      </div>
      {getLogoUrl(agentRun) && (
        <img
          className="w-[16px] h-[16px]"
          src={getLogoUrl(agentRun)}
          alt="Tool logo"
        />
      )}
    </div>
  );
};

export { AgentProfileTool };
