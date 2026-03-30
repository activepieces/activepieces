import {
  MatchDecorator,
  ViewPlugin,
  WidgetType,
  EditorView,
  ViewUpdate,
  DecorationSet,
  Decoration,
} from '@codemirror/view';

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

class VariablePillWidget extends WidgetType {
  constructor(private readonly path: string, private readonly label: string) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'ap-variable-pill';
    span.textContent = this.label;
    span.setAttribute('title', this.path);
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: WidgetType): boolean {
    if (!(other instanceof VariablePillWidget)) return false;
    return other.path === this.path && other.label === this.label;
  }
}

export function variablePillExtension(getLabel: (path: string) => string) {
  const decorator = new MatchDecorator({
    regexp: VARIABLE_REGEX,
    decorate: (add, from, to, match) => {
      const path = match[1];
      const label = getLabel(path);
      add(
        from,
        to,
        Decoration.replace({ widget: new VariablePillWidget(path, label) }),
      );
    },
  });

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  );
}
