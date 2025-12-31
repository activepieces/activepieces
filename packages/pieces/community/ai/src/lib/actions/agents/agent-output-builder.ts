import {
  AgentResult,
  AgentStepBlock,
  AgentTaskStatus,
  AgentTool,
  AgentToolType,
  assertNotNullOrUndefined,
  ContentBlockType,
  isNil,
  MarkdownContentBlock,
  ToolCallBase,
  ToolCallContentBlock,
  ToolCallStatus,
  ToolCallType,
} from '@activepieces/shared';

export const agentOutputBuilder = (prompt: string) => {
  let status: AgentTaskStatus = AgentTaskStatus.IN_PROGRESS;
  const steps: AgentStepBlock[] = [];
  let structuredOutput: Record<string, unknown> | undefined = undefined;

  return {
    fail({ message }: FinishParams) {
      if (!isNil(message)) {
        this.addMarkdown(message);
      }
      status = AgentTaskStatus.FAILED;
    },
    setStatus(_status: AgentTaskStatus) {
      status = _status;
    },
    setStructuredOutput(output: Record<string, unknown>) {
      structuredOutput = output;
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
    startToolCall({
      toolName,
      toolCallId,
      input,
      agentTools,
    }: StartToolCallParams) {
      const metadata = getToolMetadata({
        toolName,
        baseTool: {
          toolName,
          toolCallId,
          type: ContentBlockType.TOOL_CALL,
          status: ToolCallStatus.IN_PROGRESS,
          input,
          output: undefined,
          startTime: new Date().toISOString(),
        },
        tools: agentTools,
      });
      steps.push(metadata);
    },
    finishToolCall({ toolCallId, output }: FinishToolCallParams) {
      const toolIdx = steps.findIndex(
        (block) =>
          block.type === ContentBlockType.TOOL_CALL &&
          (block as ToolCallContentBlock).toolCallId === toolCallId
      );
      const tool = steps[toolIdx] as ToolCallContentBlock;
      assertNotNullOrUndefined(tool, 'Last block must be a tool call');
      steps[toolIdx] = {
        ...tool,
        status: ToolCallStatus.COMPLETED,
        endTime: new Date().toISOString(),
        output,
      };
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

type StartToolCallParams = {
  toolName: string;
  toolCallId: string;
  input: Record<string, unknown>;
  agentTools: AgentTool[];
};

type FinishParams = {
  message?: string;
};

function getToolMetadata({
  toolName,
  tools,
  baseTool,
}: GetToolMetadaParams): ToolCallContentBlock {
  const tool = tools.find((tool) => tool.toolName === toolName);
  assertNotNullOrUndefined(tool, `Tool ${toolName} not found`);

  switch (tool.type) {
    case AgentToolType.PIECE: {
      const pieceMetadata = tool.pieceMetadata;
      assertNotNullOrUndefined(pieceMetadata, 'Piece metadata is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.PIECE,
        pieceName: pieceMetadata.pieceName,
        pieceVersion: pieceMetadata.pieceVersion,
        actionName: tool.pieceMetadata.actionName,
      };
    }
    case AgentToolType.FLOW: {
      assertNotNullOrUndefined(tool.externalFlowId, 'Flow ID is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.FLOW,
        displayName: tool.toolName,
        externalFlowId: tool.externalFlowId
      };
    }
    case AgentToolType.MCP: {
      assertNotNullOrUndefined(tool.serverUrl, 'Mcp server URL is required');
      return {
        ...baseTool,
        toolCallType: ToolCallType.MCP,
        displayName: tool.toolName,
        serverUrl: tool.serverUrl,
        
      };
    }
  }
}

type GetToolMetadaParams = {
    toolName: string;
    tools: AgentTool[];
    baseTool: ToolCallBase;
}