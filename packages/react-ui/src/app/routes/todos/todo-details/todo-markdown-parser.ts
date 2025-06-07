export const todoMarkdownParser = {
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

type ToolCall = {
  type: 'tool-call';
  id: string;
  toolName: string;
  args: unknown;
  result?: string;
  status: 'pending' | 'done';
};

type TextBlock = {
  type: 'text';
  text: string;
};

type Block = ToolCall | TextBlock;

const createTextBlock = (text: string): TextBlock => ({
  type: 'text',
  text: text.trim(),
});

const parseToolCall = (toolCallStr: string): ToolCall => {
  const idMatch = toolCallStr.match(/id="([^"]+)"/);
  const jsonStart = toolCallStr.indexOf('{');
  const jsonEnd = toolCallStr.lastIndexOf('}') + 1;
  const toolCallData = JSON.parse(toolCallStr.slice(jsonStart, jsonEnd));

  return {
    type: 'tool-call',
    id: idMatch?.[1] ?? '',
    toolName: toolCallData.toolName,
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
    const toolCall = blocks[toolCallIndex] as ToolCall;
    toolCall.result = toolResultData.result;
    toolCall.status = 'done';
  }
};
