import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';
import { t } from 'i18next';

import { StepMetadata } from '@/features/pieces/lib/types';
import {
  Action,
  Trigger,
  assertNotNullOrUndefined,
  isNil,
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
    .filter((key) => key && key.trim().length > 0)
    .map(removeQuotes);
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

const isMentionNodeText = (item: string) => {
  const match = item.match(/^\{\{(.*)\}\}$/);
  if (match) {
    const content = match[1].trim();
    return /^(step_\d+|trigger)/.test(content);
  }
  return false;
};
const isStepName = (stepName: string) => {
  const pattern = /^(step_\d+|trigger)/;
  return pattern.test(stepName);
};

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
  const isMissingStep = stepDfsIndex <= 0 && isStepName(keys[0].trim());
  const displayTextPrefix = isMissingStep
    ? `${t('(Missing)')} ${keys[0].trim()}`
    : `${stepDfsIndex}. `;
  const mentionText = [stepDisplayName, ...keys.slice(1)].join(' ');
  return JSON.stringify({
    logoUrl: isMissingStep
      ? '/src/assets/img/custom/incomplete.png'
      : stepLogoUrl,
    displayText: `${displayTextPrefix} ${mentionText}`,
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

type StepMetadataWithDisplayName = StepMetadata & { stepDisplayName: string };
const getStepMetadataFromPath = (
  path: string,
  steps: (Action | Trigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
) => {
  const stepPath = removeIntroplationBrackets(path);
  const stepName = textMentionUtils.keysWithinPath(stepPath)[0].trim();
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
}[] {
  const inputSplitToNodesContent = userInputText
    .split(/(\{\{.*?\}\})/)
    .map((el) => el.split(new RegExp(`(\n)`)))
    .flat(1)
    .filter((el) => el);
  return inputSplitToNodesContent.reduce(
    (result, node) => {
      if (node === '\n') {
        result.push({
          type: TipTapNodeTypes.paragraph,
          content: [],
        });
      } else if (isMentionNodeText(node)) {
        result[result.length - 1].content.push(
          createMentionNodeFromText(node, steps, stepsMetadata),
        );
      } else {
        result[result.length - 1].content.push({
          type: TipTapNodeTypes.text,
          text: node,
        });
      }
      return result;
    },
    [
      {
        content: [],
        type: TipTapNodeTypes.paragraph,
      },
    ] as {
      type: TipTapNodeTypes.paragraph;
      content: JSONContent[];
    }[],
  );
}

function createMentionNodeFromText(
  mention: string,
  steps: (Action | Trigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
) {
  const { stepMetadata, dfsIndex } = getStepMetadataFromPath(
    mention,
    steps,
    stepsMetadata,
  );
  return parseMentionNodeFromText({
    path: mention,
    stepDisplayName: stepMetadata?.stepDisplayName ?? '',
    stepLogoUrl: stepMetadata?.logoUrl ?? '',
    stepDfsIndex: dfsIndex + 1,
  });
}

function convertTiptapJsonToText(nodes: JSONContent[]): string {
  const res = nodes.map((node, index) => {
    switch (node.type) {
      case TipTapNodeTypes.hardBreak:
        return '\n';
      case TipTapNodeTypes.text: {
        //replace &nbsp; with a normal space
        return node.text ? node.text.replaceAll('\u00A0', ' ') : '';
      }
      case TipTapNodeTypes.mention: {
        return node.attrs?.label
          ? JSON.parse(node.attrs.label).serverValue
          : '';
      }
      case TipTapNodeTypes.paragraph: {
        return `${
          isNil(node.content) ? '' : convertTiptapJsonToText(node.content)
        }${index < nodes.length - 1 ? '\n' : ''}`;
      }
      default:
        return '';
    }
  });
  return res.join('');
}

const generateMentionHtmlElement = (mentionAttrs: MentionNodeAttrs) => {
  const mentionElement = document.createElement('span');
  const apMentionNodeAttrs: ApMentionNodeAttrs = JSON.parse(
    mentionAttrs.label || '{}',
  );
  mentionElement.className =
    'inline-flex bg-muted/10 break-all my-1 mx-[1px] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px] text-muted-foreground ';
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
    imgElement.className = 'object-contain w-4 h-4';
    mentionElement.appendChild(imgElement);
  } else {
    const emptyImagePlaceHolder = document.createElement('span');
    emptyImagePlaceHolder.className = 'h-4 -mr-2';
    mentionElement.appendChild(emptyImagePlaceHolder);
  }

  const mentiontextDiv = document.createTextNode(
    apMentionNodeAttrs.displayText,
  );
  mentionElement.setAttribute('serverValue', apMentionNodeAttrs.serverValue);

  mentionElement.appendChild(mentiontextDiv);
  return mentionElement;
};

const inputThatUsesMentionClass = 'ap-text-with-mentions';
export const textMentionUtils = {
  convertTextToTipTapJsonContent,
  convertTiptapJsonToText: ({ content }: JSONContent) => {
    const nodes = content ?? [];
    const res =
      nodes.length === 1 && isNil(nodes[0].content)
        ? ''
        : convertTiptapJsonToText(nodes);
    return res;
  },
  generateMentionHtmlElement,
  keysWithinPath,
  createMentionNodeFromText,
  inputThatUsesMentionClass,
};
