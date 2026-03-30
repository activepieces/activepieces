import React from 'react';

import { FormulaEditor } from './formula-editor';
import { TiptapEditor } from './tiptap-editor';

const USE_FORMULA_EDITOR = false;

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

export const TextInputWithMentions = (props: TextInputWithMentionsProps) => {
  if (USE_FORMULA_EDITOR) {
    return <FormulaEditor {...props} />;
  }
  return <TiptapEditor {...props} />;
};
