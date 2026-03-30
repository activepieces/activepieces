import { AP_FUNCTIONS } from '@activepieces/shared';
import {
  MatchDecorator,
  ViewPlugin,
  EditorView,
  ViewUpdate,
  DecorationSet,
  Decoration,
} from '@codemirror/view';

const nameMark = Decoration.mark({ class: 'ap-fn-name-token' });
const parenOpenMark = Decoration.mark({ class: 'ap-fn-paren-open-token' });
const parenCloseMark = Decoration.mark({ class: 'ap-fn-paren-close-token' });

const fnNames = AP_FUNCTIONS.map((f) => f.name).join('|');
const FN_CALL_REGEX = new RegExp(`\\b(${fnNames})(\\()`, 'g');
const PAREN_CLOSE_REGEX = /\)/g;

function buildFnCallDecorator() {
  return new MatchDecorator({
    regexp: FN_CALL_REGEX,
    decorate: (add, from, _to, match) => {
      const nameLen = match[1].length;
      add(from, from + nameLen, nameMark);
      add(from + nameLen, from + nameLen + 1, parenOpenMark);
    },
  });
}

function buildParenCloseDecorator() {
  return new MatchDecorator({
    regexp: PAREN_CLOSE_REGEX,
    decorate: (add, from, to) => {
      add(from, to, parenCloseMark);
    },
  });
}

export function functionHighlightExtension() {
  const fnCallDecorator = buildFnCallDecorator();
  const parenCloseDecorator = buildParenCloseDecorator();

  const FnCallPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = fnCallDecorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = fnCallDecorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  );

  const ParenClosePlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = parenCloseDecorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = parenCloseDecorator.updateDeco(
          update,
          this.decorations,
        );
      }
    },
    { decorations: (v) => v.decorations },
  );

  return [FnCallPlugin, ParenClosePlugin];
}
