import { Action, Trigger } from '@activepieces/shared';
import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

import { StepMetadata } from '../features/pieces/lib/pieces-hook';

type Step = Action | Trigger;
const removeQuotes = (text: string) => {
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
};

export const keysWithinPath = (path: string) => {
  return path
    .split(/\.|\[|\]/)
    .filter((key) => key && key !== '')
    .map((key) => removeQuotes(key));
};
export type ApMentionNodeAttrs = {
  logoUrl?: string;
  displayText: string;
  serverValue: string;
};
export const customCodeMentionDisplayName = 'Custom Code';
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
const parseMentionNodeFromText = ({
  path,
  stepDisplayName,
  stepLogoUrl,
  stepDfsIndex,
}: {
  path: string;
  stepDisplayName: string;
  stepLogoUrl: string;
  stepDfsIndex: number;
}) => {
  const itemPathWithoutInterpolationDenotation = path.slice(2, path.length - 2);
  const keys = keysWithinPath(itemPathWithoutInterpolationDenotation);
  if (keys.length === 0) {
    const attrs: MentionNodeAttrs = {
      id: path,
      label: customCodeMentionDisplayName,
    };
    const insertMention: JSONContent = {
      type: TipTapNodeTypes.mention,
      attrs: attrs,
    };
    return insertMention;
  }
  const mentionText = [stepDisplayName, ...keys.slice(1)].join(' ');
  const apMentionNodeAttrs: ApMentionNodeAttrs = {
    logoUrl: stepLogoUrl,
    displayText: `${stepDfsIndex}. ${mentionText}`,
    serverValue: path,
  };
  const attrs: MentionNodeAttrs = {
    id: path,
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

export function fromTextToTipTapJsonContent({
  propertyPath,
  stepMetadataFinder,
}: {
  propertyPath: string;
  stepMetadataFinder: (
    path: string,
  ) => (StepMetadata & { dfsIndex: number }) | undefined;
}): {
  type: TipTapNodeTypes.paragraph;
  content: JSONContent[];
} {
  try {
    const regex = /(\{\{.*?\}\})/;
    const matched = propertyPath.split(regex).filter((el) => el);

    const ops: JSONContent[] = matched.map((item) => {
      if (isMentionNodeText(item)) {
        const metadata = stepMetadataFinder(item);
        return parseMentionNodeFromText({
          path: item,
          stepDisplayName: metadata?.displayName ?? '',
          stepLogoUrl: metadata?.logoUrl ?? '',
          stepDfsIndex: metadata?.dfsIndex ?? 0,
        });
      } else if (item.includes('\n')) {
        return parseTextAndHardBreakNodes(item);
      }
      return { type: TipTapNodeTypes.text, text: item };
    });
    return { type: TipTapNodeTypes.paragraph, content: ops.flat(1) };
  } catch (err) {
    console.error(propertyPath);
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
    'inline-flex bg-[#fafafa] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px]  text-accent-foreground ';

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
