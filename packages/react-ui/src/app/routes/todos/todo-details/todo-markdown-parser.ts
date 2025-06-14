import { agentbuiltInToolsNames, isNil } from "@activepieces/shared";

export const todoMarkdownParser = {
  findTodoResult: (markdown: string): string | undefined => {
    const tools = todoMarkdownParser.parse(markdown)
    const outputBlock = tools.find((tool) => tool.type === 'tool-call' && tool.toolName === agentbuiltInToolsNames.markAsComplete) as ToolCallBlock
    if (!isNil(outputBlock)) {
      const { data } = JSON.parse(outputBlock.result ?? '{}')
      return data
    }
    return undefined
  },
  parse: (markdown: string): Block[] => {
    const blocks: Block[] = [];
    let currentText = '';

    let i = 0;
    while (i < markdown.length) {
      if (markdown.startsWith('<tool-call', i)) {
        if (currentText.trim()) {
          blocks.push(createTextBlock(currentText));
          currentText = '';
        }

        const endIndex = markdown.indexOf('</tool-call>', i);
        const toolCallStr = markdown.slice(i, endIndex + '</tool-call>'.length);
        blocks.push(parseToolCall(toolCallStr));

        i = endIndex + '</tool-call>'.length;
      } else if (markdown.startsWith('<tool-result', i)) {
        if (currentText.trim()) {
          blocks.push(createTextBlock(currentText));
          currentText = '';
        }

        const endIndex = markdown.indexOf('</tool-result>', i);
        const toolResultStr = markdown.slice(
          i,
          endIndex + '</tool-result>'.length,
        );
        updateToolCallWithResult(blocks, toolResultStr);

        i = endIndex + '</tool-result>'.length;
      } else {
        currentText += markdown[i];
        i++;
      }
    }

    if (currentText.trim()) {
      blocks.push(createTextBlock(currentText));
    }

    return blocks;
  },
};

type ToolCallBlock = {
  type: 'tool-call';
  id: string;
  toolName: string;
  logoUrl?: string;
  args: unknown;
  result?: string;
  status: 'pending' | 'done';
};

type TextBlock = {
  type: 'text';
  text: string;
};

type Block = ToolCallBlock | TextBlock;

const createTextBlock = (text: string): TextBlock => ({
  type: 'text',
  text: text.trim(),
});

const parseToolCall = (toolCallStr: string): ToolCallBlock => {
  const idMatch = toolCallStr.match(/id="([^"]+)"/);
  const jsonStart = toolCallStr.indexOf('{');
  const jsonEnd = toolCallStr.lastIndexOf('}') + 1;
  const toolCallData = JSON.parse(toolCallStr.slice(jsonStart, jsonEnd));

  return {
    type: 'tool-call',
    id: idMatch?.[1] ?? '',
    toolName: toolCallData.displayName,
    logoUrl: toolCallData.logoUrl,
    args: toolCallData.result,
    status: 'pending',
  };
};

const updateToolCallWithResult = (
  blocks: Block[],
  toolResultStr: string,
): void => {
  const idMatch = toolResultStr.match(/id="([^"]+)"/);
  const jsonStart = toolResultStr.indexOf('{');
  const jsonEnd = toolResultStr.lastIndexOf('}') + 1;
  const toolResultData = JSON.parse(toolResultStr.slice(jsonStart, jsonEnd));

  const toolCallId = idMatch?.[1] ?? '';
  const toolCallIndex = blocks.findIndex(
    (block) => block.type === 'tool-call' && block.id === toolCallId,
  );

  if (toolCallIndex !== -1) {
    const toolCall = blocks[toolCallIndex] as ToolCallBlock;
    toolCall.result = toolResultData.result;
    toolCall.status = 'done';
  }
};
