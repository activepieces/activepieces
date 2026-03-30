import { linter, Diagnostic } from '@codemirror/lint';
import { Parser } from 'expr-eval';

const validationParser = new Parser();

const VARIABLE_PLACEHOLDER_REGEX = /\{\{[^}]+\}\}/g;

export function formulaLintExtension() {
  return linter((view): Diagnostic[] => {
    const text = view.state.doc.toString();
    if (!text.trim()) {
      return [];
    }

    const normalized = text.replace(VARIABLE_PLACEHOLDER_REGEX, '"_v"');

    try {
      validationParser.parse(normalized);
      return [];
    } catch (e) {
      return [
        {
          from: 0,
          to: view.state.doc.length,
          severity: 'error',
          message: e instanceof Error ? e.message : 'Invalid expression',
        },
      ];
    }
  });
}
