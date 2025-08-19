import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

import { StepMetadata } from '@/lib/types';
import {
  FlowAction,
  FlowTrigger,
  assertNotNullOrUndefined,
  isNil,
} from '@activepieces/shared';

const removeQuotes = (text: string) => {
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
};
const incrementArrayIndexes = (text: string) => {
  const numberText = Number(text);
  if (Number.isNaN(numberText)) {
    return text;
  }
  return `${numberText + 1}`;
};

const keysWithinPath = (path: string) => {
  return path
    .split(/\.|\[|\]/)
    .filter((key) => key && key.trim().length > 0)
    .map(incrementArrayIndexes)
    .map(removeQuotes);
};

type ApMentionNodeAttrs = {
  logoUrl?: string;
  displayText: string;
  serverValue: string;
};
const flattenNestedKeysRegex = /^flattenNestedKeys\((\w+),\s*\[(.*?)\]\)$/;
enum TipTapNodeTypes {
  paragraph = 'paragraph',
  text = 'text',
  hardBreak = 'hardBreak',
  mention = 'mention',
}

const isMentionNodeText = (item: string) => {
  const itemIsToken = item.match(/^\{\{(.*)\}\}$/);
  if (itemIsToken) {
    const content = itemIsToken[1].trim();
    const itemIsFlattenedArray = content.match(flattenNestedKeysRegex);
    if (itemIsFlattenedArray) {
      return true;
    }
    return /^(step_\d+|trigger)/.test(content);
  }
  return false;
};

type StepMetadataWithDisplayName = StepMetadata & { stepDisplayName: string };

function convertTextToTipTapJsonContent(
  userInputText: string,
  steps: (FlowAction | FlowTrigger)[],
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

function parseFlattenArrayPath(input: string): {
  isValid: boolean;
  stepName?: string;
  arrayPath?: string[];
} {
  const match = input.match(flattenNestedKeysRegex);

  if (!match) {
    return { isValid: false };
  }

  const stepName = match[1];
  const arrayPath = match[2]
    .split(',')
    .map((item) => item.trim().replace(/['"]/g, ''));

  return {
    isValid: true,
    stepName,
    arrayPath,
  };
}

const removeIntroplationBrackets = (text: string) => {
  if (text.startsWith('{{') && text.endsWith('}}')) {
    return text.slice(2, text.length - 2).trim();
  }
  return text;
};

function parseStepAndNameFromMention(mention: string) {
  const mentionWithoutInterpolationBrackets =
    removeIntroplationBrackets(mention);
  const { isValid, stepName, arrayPath } = parseFlattenArrayPath(
    mentionWithoutInterpolationBrackets,
  );
  if (isValid) {
    return {
      stepName,
      path: arrayPath ?? [],
    };
  }
  const keys = keysWithinPath(mentionWithoutInterpolationBrackets);
  if (keys.length === 0) {
    return {
      stepName: null,
      path: [],
    };
  }
  return {
    stepName: keys[0],
    path: keys.slice(1),
  };
}

function parseLabelFromMention(
  mention: string,
  steps: (FlowAction | FlowTrigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
) {
  const { stepName, path } = parseStepAndNameFromMention(mention);
  const stepIdx = steps.findIndex((step) => step.name === stepName);
  if (stepIdx < 0) {
    return {
      displayText: `(Missing) ${stepName}`,
      serverValue: mention,
      logoUrl: '/src/assets/img/custom/incomplete.png',
    };
  }
  const stepMetadata = stepsMetadata[stepIdx];
  return {
    displayText: `${stepIdx + 1}. ${
      stepMetadata?.stepDisplayName ?? ''
    } ${path.join(' ')}`,
    serverValue: mention,
    logoUrl: stepMetadata?.logoUrl,
  };
}

function createMentionNodeFromText(
  mention: string,
  steps: (FlowAction | FlowTrigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
) {
  return {
    type: TipTapNodeTypes.mention,
    attrs: {
      id: mention,
      label: JSON.stringify(
        parseLabelFromMention(mention, steps, stepsMetadata),
      ),
    },
  };
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

const inputWithMentionsCssClass = 'ap-text-with-mentions';
const dataSelectorCssClassSelector = 'ap-data-selector';
const isDataSelectorOrChildOfDataSelector = (element: HTMLElement) => {
  return (
    element.classList.contains(dataSelectorCssClassSelector) ||
    !isNil(element.closest(`.${dataSelectorCssClassSelector}`))
  );
};
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
  createMentionNodeFromText,
  inputWithMentionsCssClass,
  dataSelectorCssClassSelector,
  isDataSelectorOrChildOfDataSelector,
};
