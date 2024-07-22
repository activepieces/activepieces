import { Action, Trigger } from '@activepieces/shared';
import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

type Step = Action | Trigger;
const keysWithinPath = (path: string) => {
  const result: string[] = [];
  let insideBrackets = false;
  let word = '';
  let insideDot = true;
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '.' && !insideDot && !insideBrackets) {
      insideDot = true;
      continue;
    }
    if (path[i] === '.' && insideDot) {
      result.push(word);
      word = '';
    } else if (insideDot && path[i] !== '[') {
      word += path[i];
    } else if (path[i] === '[') {
      if (word) {
        result.push(word);
      }
      word = '';
      insideBrackets = true;
      insideDot = false;
    } else if (path[i] === ']') {
      result.push(word);
      word = '';
      insideBrackets = false;
    } else {
      word += path[i];
    }
  }
  if (insideDot) {
    result.push(word);
  }

  return result.map((w) => {
    if (w.startsWith(`"`) || w.startsWith(`'`)) {
      return w.slice(1, w.length - 1);
    }
    return w;
  });
};
export type ApMentionNodeAttrs = {
  logoUrl?: string;
  displayText: string;
  serverValue: string;
};
export const customCodeMentionDisplayName = 'Custom Code';
function replaceStepNameWithDisplayName(
  stepName: string,
  allStepsMetaData: (MentionListItem & { step: Step })[],
) {
  const stepDisplayName = allStepsMetaData.find((s) => s.step.name === stepName)
    ?.step.displayName;
  if (stepDisplayName) {
    return stepDisplayName;
  }
  return customCodeMentionDisplayName;
}
export interface MentionListItem {
  label: string;
  value: string;
  logoUrl?: string;
}
export type StepWithIndex = Step & { indexInDfsTraversal: number };
export enum TipTapNodeTypes {
  paragraph = 'paragraph',
  text = 'text',
  hardBreak = 'hardBreak',
  mention = 'mention',
}
const isMentionNodeText = (item: string) => {
  return (
    item.length > 5 &&
    item[0] === '{' &&
    item[1] === '{' &&
    item[item.length - 1] === '}' &&
    item[item.length - 2] === '}'
  );
};
const parseMentionNodeFromText = (
  item: string,
  allStepsMetaData: (MentionListItem & { step: StepWithIndex })[],
) => {
  const itemPathWithoutInterpolationDenotation = item.slice(2, item.length - 2);
  const keys = keysWithinPath(itemPathWithoutInterpolationDenotation);
  const stepName = keys[0];
  const stepMetaData = allStepsMetaData.find((s) => s.step.name === stepName);

  //Mention text is the whole path joined with spaces
  const mentionText = [
    replaceStepNameWithDisplayName(stepName, allStepsMetaData),
    ...keys.slice(1),
  ].join(' ');
  const indexInDfsTraversal = stepMetaData?.step.indexInDfsTraversal;
  const prefix = indexInDfsTraversal ? `${indexInDfsTraversal}. ` : '';
  const apMentionNodeAttrs: ApMentionNodeAttrs = {
    logoUrl: stepMetaData?.logoUrl,
    displayText: prefix + mentionText,
    serverValue: item,
  };
  const attrs: MentionNodeAttrs = {
    id: item,
    label: JSON.stringify(apMentionNodeAttrs),
  };
  const insertMention: JSONContent = {
    type: TipTapNodeTypes.mention,
    attrs: attrs,
  };
  return insertMention;
};
const parseTextAndHardBreakNodes = (item: string) => {
  const endlineRegex = new RegExp(`(\n)`);
  const hardBreak: JSONContent = {
    type: TipTapNodeTypes.hardBreak,
  };
  const resultArray: JSONContent[] = item
    .split(endlineRegex)
    .filter((item) => !!item)
    .map((text) => {
      if (text !== '\n') return { type: TipTapNodeTypes.text, text };
      return hardBreak;
    });
  return resultArray;
};

export function fromTextToTipTapJsonContent(
  text: string,
  allStepsMetaData: (MentionListItem & { step: StepWithIndex })[],
): {
  type: TipTapNodeTypes.paragraph;
  content: JSONContent[];
} {
  try {
    const regex = /(\{\{.*?\}\})/;
    const matched = text.split(regex).filter((el) => el);
    const ops: JSONContent[] = matched.map((item) => {
      if (isMentionNodeText(item)) {
        return parseMentionNodeFromText(item, allStepsMetaData);
      } else if (item.includes('\n')) {
        return parseTextAndHardBreakNodes(item);
      }
      return { type: TipTapNodeTypes.text, text: item };
    });
    return { type: TipTapNodeTypes.paragraph, content: ops.flat(1) };
  } catch (err) {
    console.error(text);
    console.error(err);
    throw err;
  }
}

export const fromTiptapJsonContentToText = (content: JSONContent) => {
  let res = '';
  let firstParagraph = true;

  content.content?.forEach((node) => {
    const nodeType = node.type as TipTapNodeTypes;
    switch (nodeType) {
      case TipTapNodeTypes.hardBreak: {
        res = res.concat('\n');
        break;
      }
      case TipTapNodeTypes.text: {
        if (node.text) {
          res = res.concat(node.text);
        } else {
          tiptapWarning('node.text is undefined', node);
        }
        break;
      }
      case TipTapNodeTypes.mention: {
        if (node.attrs?.label) {
          const apMentionNodeAttrs: ApMentionNodeAttrs = JSON.parse(
            node.attrs.label || '{}',
          );
          res = res.concat(`${apMentionNodeAttrs.serverValue}`);
        } else {
          tiptapWarning('node.attrs.label is undefined', node);
        }
        break;
      }
      case TipTapNodeTypes.paragraph: {
        if (!firstParagraph) {
          res = res.concat('\n');
        }
        firstParagraph = false;
        res = res.concat(fromTiptapJsonContentToText(node));
        break;
      }
    }
  });
  return res;
};

export const generateMentionHtmlElement = (mentionAttrs: MentionNodeAttrs) => {
  const mentionElement = document.createElement('span');
  const apMentionNodeAttrs: ApMentionNodeAttrs = JSON.parse(
    mentionAttrs.label || '{}',
  );
  mentionElement.className =
    'inline-flex bg-[#fafafa] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px] text-base text-accent-foreground leading-[18px]';

  if (mentionAttrs.label) {
    mentionElement.dataset.label = mentionAttrs.label;
  } else {
    tiptapWarning('mentionAttrs.label is undefined', mentionAttrs);
  }
  if (mentionAttrs.id) {
    mentionElement.dataset.id = mentionAttrs.id;
  } else {
    tiptapWarning('mentionAttrs.id is undefined', mentionAttrs);
  }
  if (apMentionNodeAttrs.displayText) {
    mentionElement.dataset.displayText = apMentionNodeAttrs.displayText;
  } else {
    tiptapWarning(
      'apMentionNodeAttrs.displayText is undefined',
      apMentionNodeAttrs,
    );
  }
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

const tiptapWarning = (message: string, el: unknown) => {
  console.warn(`${message} el=${JSON.stringify(el, null, 2)}`);
};
