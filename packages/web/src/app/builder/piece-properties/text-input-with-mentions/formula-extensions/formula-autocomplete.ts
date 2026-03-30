import { AP_FUNCTIONS } from '@activepieces/shared';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';

function formulaCompletions(
  context: CompletionContext,
): CompletionResult | null {
  const before = context.matchBefore(/[a-z_][a-z0-9_]*/i);
  if (!before || (before.from === before.to && !context.explicit)) {
    return null;
  }

  const prefix = before.text.toLowerCase();
  const options = AP_FUNCTIONS.filter((fn) =>
    fn.name.toLowerCase().startsWith(prefix),
  ).map((fn) => ({
    label: fn.name,
    type: 'function',
    detail: fn.description,
    apply: (
      view: EditorView,
      _completion: { label: string },
      from: number,
      to: number,
    ) => {
      view.dispatch({
        changes: { from, to, insert: fn.name + '(' },
        selection: { anchor: from + fn.name.length + 1 },
      });
    },
  }));

  return {
    from: before.from,
    options,
  };
}

export function formulaAutocompleteExtension() {
  return autocompletion({ override: [formulaCompletions] });
}
