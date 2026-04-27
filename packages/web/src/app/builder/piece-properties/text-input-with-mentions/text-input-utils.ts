import {
  AP_FUNCTIONS,
  FlowAction,
  FlowTrigger,
  assertNotNullOrUndefined,
  formulaEvaluator,
  isNil,
} from '@activepieces/shared';
import { MentionNodeAttrs } from '@tiptap/extension-mention';
import { JSONContent } from '@tiptap/react';

import { StepMetadata } from '@/features/pieces';

import { FUNCTION_SEP_NODE_TYPE } from './extensions/function-sep-node';
import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './extensions/function-start-node';

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

type StepMetadataWithDisplayName = StepMetadata & { stepDisplayName: string };

const ZWS = '\u200B';

type ExprToken =
  | { kind: 'fn_open'; name: string }
  | { kind: 'fn_close' }
  | { kind: 'fn_sep' }
  | { kind: 'variable'; value: string }
  | { kind: 'newline' }
  | { kind: 'text'; value: string };

function tokenizeExpression(expr: string): ExprToken[] {
  const tokens: ExprToken[] = [];
  const fnNames = new Set(AP_FUNCTIONS.map((f) => f.name));
  let i = 0;
  let fnDepth = 0;

  while (i < expr.length) {
    if (expr[i] === '{' && expr[i + 1] === '{') {
      const end = expr.indexOf('}}', i + 2);
      if (end !== -1) {
        tokens.push({ kind: 'variable', value: expr.slice(i, end + 2) });
        i = end + 2;
        continue;
      }
    }

    if (expr[i] === '\n') {
      tokens.push({ kind: 'newline' });
      i++;
      continue;
    }

    const fnMatch = expr.slice(i).match(/^([a-z_][a-z0-9_]*)\(/i);
    if (fnMatch && fnNames.has(fnMatch[1])) {
      tokens.push({ kind: 'fn_open', name: fnMatch[1] });
      fnDepth++;
      i += fnMatch[1].length + 1;
      continue;
    }

    if (expr[i] === ')') {
      tokens.push({ kind: 'fn_close' });
      if (fnDepth > 0) fnDepth--;
      i++;
      continue;
    }

    if (expr[i] === ';' && fnDepth > 0) {
      tokens.push({ kind: 'fn_sep' });
      i++;
      continue;
    }

    // Accumulate plain text, tracking string literals so that `)` / `;` / function
    // names inside quoted arguments don't prematurely close a function node
    // (e.g. `prefix("(CEO)"; ...)` must round-trip losslessly).
    let text = '';
    let inString: '"' | "'" | null = null;
    while (i < expr.length) {
      const ch = expr[i];
      if (inString) {
        if (ch === inString && expr[i - 1] !== '\\') inString = null;
        text += ch;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = ch;
        text += ch;
        i++;
        continue;
      }
      if (ch === '{' && expr[i + 1] === '{') break;
      if (ch === '\n') break;
      if (ch === ')') break;
      if (ch === ';' && fnDepth > 0) break;
      const ahead = expr.slice(i).match(/^([a-z_][a-z0-9_]*)\(/i);
      if (ahead && fnNames.has(ahead[1])) break;
      text += ch;
      i++;
    }
    if (text) tokens.push({ kind: 'text', value: text });
  }

  return tokens;
}

function convertTextToTipTapJsonContent(
  userInputText: string,
  steps: (FlowAction | FlowTrigger)[],
  stepsMetadata: (StepMetadataWithDisplayName | undefined)[],
): { type: TipTapNodeTypes.paragraph; content: JSONContent[] }[] {
  // Strip ap-formula-v1::{...} wrappers before tokenizing so the editor can
  // reconstruct function nodes from the inner expression. Saved values use the
  // wrapper; the editor's internal tree does not.
  const tokens = tokenizeExpression(formulaEvaluator.unwrap(userInputText));
  const paragraphs: {
    type: TipTapNodeTypes.paragraph;
    content: JSONContent[];
  }[] = [{ type: TipTapNodeTypes.paragraph, content: [] }];
  const fnStack: string[] = [];

  for (const token of tokens) {
    const para = paragraphs[paragraphs.length - 1];
    switch (token.kind) {
      case 'fn_open': {
        const id = crypto.randomUUID();
        fnStack.push(id);
        para.content.push({
          type: FUNCTION_START_NODE_TYPE,
          attrs: { id, functionName: token.name },
        });
        // ZWS anchors the cursor visually between the start badge and arg content
        para.content.push({ type: TipTapNodeTypes.text, text: ZWS });
        break;
      }
      case 'fn_sep': {
        const openId = fnStack[fnStack.length - 1];
        if (openId !== undefined) {
          para.content.push({
            type: FUNCTION_SEP_NODE_TYPE,
            attrs: { openId },
          });
          para.content.push({ type: TipTapNodeTypes.text, text: ZWS });
        }
        break;
      }
      case 'fn_close': {
        const openId = fnStack.pop();
        if (openId !== undefined) {
          para.content.push({
            type: FUNCTION_END_NODE_TYPE,
            attrs: { openId },
          });
        } else {
          para.content.push({ type: TipTapNodeTypes.text, text: ')' });
        }
        break;
      }
      case 'variable':
        para.content.push(
          createMentionNodeFromText(token.value, steps, stepsMetadata),
        );
        break;
      case 'newline':
        paragraphs.push({ type: TipTapNodeTypes.paragraph, content: [] });
        break;
      case 'text':
        para.content.push({ type: TipTapNodeTypes.text, text: token.value });
        break;
    }
  }

  return paragraphs;
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

function convertTiptapJsonToText(
  nodes: JSONContent[],
  state: { fnDepth: number } = { fnDepth: 0 },
): string {
  const res = nodes.map((node, index) => {
    switch (node.type) {
      case TipTapNodeTypes.hardBreak:
        return '\n';
      case TipTapNodeTypes.text: {
        return node.text
          ? node.text.replaceAll('\u00A0', ' ').replaceAll(ZWS, '')
          : '';
      }
      case TipTapNodeTypes.mention: {
        return node.attrs?.label
          ? JSON.parse(node.attrs.label).serverValue
          : '';
      }
      case FUNCTION_START_NODE_TYPE: {
        const attrs = node.attrs as { functionName?: string } | undefined;
        const isTopLevel = state.fnDepth === 0;
        state.fnDepth++;
        const prefix = isTopLevel ? formulaEvaluator.PREFIX : '';
        return `${prefix}${attrs?.functionName ?? ''}(`;
      }
      case FUNCTION_END_NODE_TYPE: {
        state.fnDepth--;
        const suffix = state.fnDepth === 0 ? formulaEvaluator.SUFFIX : '';
        return `)${suffix}`;
      }
      case FUNCTION_SEP_NODE_TYPE: {
        return ';';
      }
      case TipTapNodeTypes.paragraph: {
        return `${
          isNil(node.content)
            ? ''
            : convertTiptapJsonToText(node.content, state)
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
    'inline-flex bg-muted/10 break-all my-1 mx-px border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px] text-muted-foreground ';
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
  parseLabelFromMention,
  inputWithMentionsCssClass,
  dataSelectorCssClassSelector,
  isDataSelectorOrChildOfDataSelector,
};
