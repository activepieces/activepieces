import { Action, Trigger } from '@activepieces/shared';
import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

import { StepMetadata } from '../../../features/pieces/lib/pieces-hook';

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
/**i.e: path-> step_1['prop1'] => result: ['step_1','prop1'] */
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

const customCodeMentionDisplayName = 'Custom Code';
enum TipTapNodeTypes {
  paragraph = 'paragraph',
  text = 'text',
  hardBreak = 'hardBreak',
  mention = 'mention',
}
const isMentionNodeText = (item: string) => /^\{\{.*\}\}$/.test(item);
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
  return item
    .split(endlineRegex)
    .filter((item) => !!item)
    .map((text) => {
      if (text !== '\n') return { type: TipTapNodeTypes.text, text };
      return hardBreak;
    });
};

const getStepMetadataFromPath = (
  path: string,
  steps: (Action | Trigger)[],
  stepsMetadata: (StepMetadata | undefined)[],
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
  stepsMetadata: (StepMetadata | undefined)[],
): {
  type: TipTapNodeTypes.paragraph;
  content: JSONContent[];
} {
  const inputSplitToNodesContent = userInputText
    .split(/(\{\{.*?\}\})/)
    .filter((el) => el);
  const contentNodes: JSONContent[] = inputSplitToNodesContent.map((nc) => {
    const { stepMetadata, dfsIndex } = getStepMetadataFromPath(
      nc,
      steps,
      stepsMetadata,
    );
    return isMentionNodeText(nc)
      ? parseMentionNodeFromText({
          path: nc,
          stepDisplayName: stepMetadata?.displayName ?? '',
          stepLogoUrl: stepMetadata?.logoUrl ?? '',
          stepDfsIndex: dfsIndex + 1 ?? 0,
        })
      : nc.includes('\n')
      ? parseTextAndHardBreakNodes(nc)
      : { type: TipTapNodeTypes.text, text: nc };
  });
  return { type: TipTapNodeTypes.paragraph, content: contentNodes.flat(1) };
}

const convertTiptapJsonToText: (content: JSONContent) => string = ({
  content,
}: JSONContent) => {
  let isFirstParagraph = true;
  const nodes = content ?? [];
  return nodes
    .map((n) => {
      switch (n.type) {
        case TipTapNodeTypes.hardBreak:
          return '\n';

        case TipTapNodeTypes.text:
          if (n.text) {
            return n.text;
          } else {
            tiptapWarning('node.text is undefined', n);
            return '';
          }

        case TipTapNodeTypes.mention:
          if (n.attrs?.label) {
            const mentionAttrs: ApMentionNodeAttrs = JSON.parse(n.attrs.label);
            return mentionAttrs.serverValue;
          } else {
            tiptapWarning('node.attrs.label is undefined', n);
            return '';
          }

        case TipTapNodeTypes.paragraph:
          if (!isFirstParagraph) return '\n';
          isFirstParagraph = false;
          return convertTiptapJsonToText(n);
        default:
          tiptapWarning('unknown node type', n);
          return '';
      }
    })
    .join('');
};

const generateMentionHtmlElement = (mentionAttrs: MentionNodeAttrs) => {
  const mentionElement = document.createElement('span');
  const apMentionNodeAttrs: ApMentionNodeAttrs = JSON.parse(
    mentionAttrs.label || '{}',
  );
  mentionElement.className =
    'inline-flex bg-[#fafafa]  my-1 mx-[1px] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px]  text-accent-foreground ';

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

export const textMentionUtils = {
  convertTextToTipTapJsonContent,
  convertTiptapJsonToText,
  generateMentionHtmlElement,
  keysWithinPath,
};
