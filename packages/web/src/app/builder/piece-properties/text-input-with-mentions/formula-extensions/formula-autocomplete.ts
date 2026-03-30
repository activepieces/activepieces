import { AP_FUNCTIONS } from '@activepieces/shared';
import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';

type ApplyView = {
  dispatch: (tr: {
    changes: { from: number; to: number; insert: string };
    selection: { anchor: number };
  }) => void;
};

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
  ).map(
    (fn): Completion => ({
      label: fn.name,
      type: 'function',
      detail: fn.description,
      apply: (
        view: ApplyView,
        _completion: Completion,
        from: number,
        to: number,
      ) => {
        view.dispatch({
          changes: { from, to, insert: fn.name + '(' },
          selection: { anchor: from + fn.name.length + 1 },
        });
      },
    }),
  );

  return {
    from: before.from,
    options,
  };
}

export function formulaAutocompleteExtension() {
  return autocompletion({ override: [formulaCompletions] });
}
