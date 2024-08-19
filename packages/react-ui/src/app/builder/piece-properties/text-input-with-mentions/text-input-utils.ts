import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

import { StepMetadata } from '@/features/pieces/lib/pieces-hook';
import {
  Action,
  Trigger,
  assertNotNullOrUndefined,
} from '@activepieces/shared';

const removeIntroplationBrackets = (text: string) => {
  return text.slice(2, text.length - 2);
};

const removeQuotes = (text: string) => {
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
};

const keysWithinPath = (path: string) => {
  return path
    .split(/\.|\[|\]/)
    .filter((key) => key && key !== '')
    .map((key) => removeQuotes(key));
};

type ApMentionNodeAttrs = {
  logoUrl?: string;
  displayText: string;
  serverValue: string;
};

enum TipTapNodeTypes {
  paragraph = 'paragraph',
  text = 'text',
  hardBreak = 'hardBreak',
  mention = 'mention',
}
const isMentionNodeText = (item: string) => /^\{\{.*\}\}$/.test(item);

type ParseMentionNodeFromText = {
  path: string;
  stepDisplayName: string;
  stepLogoUrl: string;
  stepDfsIndex: number;
};
function getLabelForMention({
  stepDisplayName,
  stepLogoUrl,
  stepDfsIndex,
  path,
}: ParseMentionNodeFromText) {
  const keys = keysWithinPath(removeIntroplationBrackets(path));
  if (keys.length === 0) {
    return 'Custom Code';
  }
  const mentionText = [stepDisplayName, ...keys.slice(1)].join(' ');
  return JSON.stringify({
    logoUrl: stepLogoUrl,
    displayText: `${stepDfsIndex}. ${mentionText}`,
    serverValue: path,
  });
}

function parseMentionNodeFromText(request: ParseMentionNodeFromText) {
  return {
    type: TipTapNodeTypes.mention,
    attrs: {
      id: request.path,
      label: getLabelForMention(request),
    },
  };
}

const parseTextAndHardBreakNodes = (item: string) => {
  const endlineRegex = new RegExp(`(\n)`);
  const hardBreak: JSONContent = {
    type: TipTapNodeTypes.hardBreak,
  };
  return item
    .split(endlineRegex)
    .filter((item) => !!item)
    .map((text) => {
      if (text !== '\n') return { type: TipTapNodeTypes.text, text };
      return hardBreak;
    });
};
type StepMetadataWithDisplayName = StepMetadata & { stepDisplayName: string };
const getStepMetadataFromPath = (
  path: string,
  steps: (Action | Trigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
) => {
  const stepPath = removeIntroplationBrackets(path);
  const stepName = textMentionUtils.keysWithinPath(stepPath)[0];
  const index = steps.findIndex((step) => step.name === stepName);
  return {
    dfsIndex: index,
    stepMetadata: stepsMetadata[index],
  };
};

function convertTextToTipTapJsonContent(
  userInputText: string,
  steps: (Action | Trigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
): {
  type: TipTapNodeTypes.paragraph;
  content: JSONContent[];
} {
  const inputSplitToNodesContent = userInputText
    .split(/(\{\{.*?\}\})/)
    .filter((el) => el);
  const contentNodes: JSONContent[] = inputSplitToNodesContent.map((node) => {
    const { stepMetadata, dfsIndex } = getStepMetadataFromPath(
      node,
      steps,
      stepsMetadata,
    );
    const includeNewLine = node.includes('\n');
    if (includeNewLine) {
      return parseTextAndHardBreakNodes(node);
    }
    if (isMentionNodeText(node)) {
      return parseMentionNodeFromText({
        path: node,
        stepDisplayName: stepMetadata?.stepDisplayName ?? '',
        stepLogoUrl: stepMetadata?.logoUrl ?? '',
        stepDfsIndex: dfsIndex + 1,
      });
    }
    return { type: TipTapNodeTypes.text, text: node };
  });
  return { type: TipTapNodeTypes.paragraph, content: contentNodes.flat(1) };
}

function convertTiptapJsonToText({ content }: JSONContent): string {
  const nodes = content ?? [];
  return nodes
    .map((node) => {
      switch (node.type) {
        case TipTapNodeTypes.hardBreak:
          return '\n';
        case TipTapNodeTypes.text: {
          return node.text ?? '';
        }
        case TipTapNodeTypes.mention:
          return node.attrs?.label
            ? JSON.parse(node.attrs.label).serverValue
            : '';
        case TipTapNodeTypes.paragraph:
          return convertTiptapJsonToText(node);
        default:
          return '';
      }
    })
    .join('');
}

const generateMentionHtmlElement = (mentionAttrs: MentionNodeAttrs) => {
  const mentionElement = document.createElement('span');
  const apMentionNodeAttrs: ApMentionNodeAttrs = JSON.parse(
    mentionAttrs.label || '{}',
  );
  mentionElement.className =
    'inline-flex bg-muted/10  my-1 mx-[1px] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px] text-muted-foreground ';
  assertNotNullOrUndefined(mentionAttrs.label, 'mentionAttrs.label');
  assertNotNullOrUndefined(mentionAttrs.id, 'mentionAttrs.id');
  assertNotNullOrUndefined(
    apMentionNodeAttrs.displayText,
    'apMentionNodeAttrs.displayText',
  );
  mentionElement.dataset.id = mentionAttrs.id;
  mentionElement.dataset.label = mentionAttrs.label;
  mentionElement.dataset.displayText = apMentionNodeAttrs.displayText;
  mentionElement.dataset.type = TipTapNodeTypes.mention;
  mentionElement.contentEditable = 'false';

  if (apMentionNodeAttrs.logoUrl) {
    const imgElement = document.createElement('img');
    imgElement.src = apMentionNodeAttrs.logoUrl;
    imgElement.className = 'object-fit w-4 h-4';
    mentionElement.appendChild(imgElement);
  }

  const mentiontextDiv = document.createTextNode(
    apMentionNodeAttrs.displayText,
  );
  mentionElement.setAttribute('serverValue', apMentionNodeAttrs.serverValue);

  mentionElement.appendChild(mentiontextDiv);
  return mentionElement;
};

export const textMentionUtils = {
  convertTextToTipTapJsonContent,
  convertTiptapJsonToText,
  generateMentionHtmlElement,
  keysWithinPath,
};
