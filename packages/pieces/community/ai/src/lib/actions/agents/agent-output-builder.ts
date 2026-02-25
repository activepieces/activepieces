import {
  AgentResult,
  AgentStepBlock,
  AgentTaskStatus,
  AgentTool,
  AgentToolType,
  assertNotNullOrUndefined,
  ContentBlockType,
  ExecutionToolStatus,
  isNil,
  MarkdownContentBlock,
  ToolCallBase,
  ToolCallContentBlock,
  ToolCallStatus,
  ToolCallType,
} from '@activepieces/shared';

export type ToolKeyToAgentTool = Record<string, AgentTool>;

export const agentOutputBuilder = (prompt: string) => {
  let status: AgentTaskStatus = AgentTaskStatus.IN_PROGRESS;
  const steps: AgentStepBlock[] = [];
  let structuredOutput: Record<string, unknown> | undefined = undefined;
  let toolKeyToAgentTool: ToolKeyToAgentTool = {};

  return {
    setStatus(_status: AgentTaskStatus) {
      status = _status;
    },
    setToolMap(map: ToolKeyToAgentTool) {
      toolKeyToAgentTool = map;
    },
    setStructuredOutput(output: Record<string, unknown>) {
      structuredOutput = output;
    },
    appendErrorToStructuredOutput(errorDetails: unknown) {
      if (structuredOutput) {
        structuredOutput["errors"] = [...(structuredOutput["errors"] as string[] || []), errorDetails];
      }
    },
    fail({ message }: FinishParams) {
      status = AgentTaskStatus.FAILED;
      if (!isNil(message)) {
        this.addMarkdown(message);
        this.appendErrorToStructuredOutput({ message });
      }
    },
    addMarkdown(markdown: string) {
      if (
        steps.length === 0 ||
        steps[steps.length - 1].type !== ContentBlockType.MARKDOWN
      ) {
        steps.push({
          type: ContentBlockType.MARKDOWN,
          markdown: '',
        });
      }
      (steps[steps.length - 1] as MarkdownContentBlock).markdown += markdown;
    },
    startToolCall({ toolName, toolCallId, input }: StartToolCallParams) {
      const baseTool: ToolCallBase = {
        toolName,
        toolCallId,
        type: ContentBlockType.TOOL_CALL,
        status: ToolCallStatus.IN_PROGRESS,
        input,
        output: undefined,
        startTime: new Date().toISOString(),
      };
      steps.push(getToolMetadata({ toolName, baseTool, toolKeyToAgentTool }));
    },
    finishToolCall({ toolCallId, output }: FinishToolCallParams) {
      const toolIdx = steps.findIndex(
        (block) =>
          block.type === ContentBlockType.TOOL_CALL &&
          (block as ToolCallContentBlock).toolCallId === toolCallId
      );
      if (toolIdx === -1) {
        return;
      }
      const tool = steps[toolIdx] as ToolCallContentBlock;
      steps[toolIdx] = {
        ...tool,
        status: ToolCallStatus.COMPLETED,
        endTime: new Date().toISOString(),
        output,
      };
    },
    failToolCall({ toolCallId }: FaildToolCallParams) {
      const toolIdx = steps.findIndex(
        (block) =>
          block.type === ContentBlockType.TOOL_CALL &&
          (block as ToolCallContentBlock).toolCallId === toolCallId
      );
      if (toolIdx === -1) {
        return;
      }
      const tool = steps[toolIdx] as ToolCallContentBlock;
      steps[toolIdx] = {
        ...tool,
        status: ToolCallStatus.COMPLETED,
        endTime: new Date().toISOString(),
        output: {
          status: ExecutionToolStatus.FAILED
        },
      };
    },
    hasTextContent(): boolean {
      return steps.some(
        (step) =>
          step.type === ContentBlockType.MARKDOWN &&
          step.markdown.trim().length > 0
      );
    },
    build(): AgentResult {
      return {
        status,
        steps,
        structuredOutput,
        prompt,
      };
    },
  };
};

type FinishToolCallParams = {
  toolCallId: string;
  output: Record<string, unknown>;
};

type FaildToolCallParams = {
  toolCallId: string;
};

type StartToolCallParams = {
  toolName: string;
  toolCallId: string;
  input: Record<string, unknown>;
};

type FinishParams = {
  message?: string;
};

function getToolMetadata({
  toolName,
  baseTool,
  toolKeyToAgentTool,
}: GetToolMetadataParams): ToolCallContentBlock {
  const tool = toolKeyToAgentTool[toolName];
  assertNotNullOrUndefined(tool, `Tool ${toolName} not found`);

  switch (tool.type) {
    case AgentToolType.PIECE: {
      assertNotNullOrUndefined(tool.pieceMetadata, 'Piece metadata is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.PIECE,
        pieceName: tool.pieceMetadata.pieceName,
        pieceVersion: tool.pieceMetadata.pieceVersion,
        actionName: tool.pieceMetadata.actionName,
      };
    }
    case AgentToolType.FLOW: {
      assertNotNullOrUndefined(tool.externalFlowId, 'Flow ID is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.FLOW,
        displayName: tool.toolName,
        externalFlowId: tool.externalFlowId,
      };
    }
    case AgentToolType.MCP: {
      assertNotNullOrUndefined(tool.serverUrl, 'MCP server URL is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.MCP,
        displayName: toolName,
        serverUrl: tool.serverUrl,
      };
    }
  }
}

type GetToolMetadataParams = {
  toolName: string;
  toolKeyToAgentTool: ToolKeyToAgentTool;
  baseTool: ToolCallBase;
};