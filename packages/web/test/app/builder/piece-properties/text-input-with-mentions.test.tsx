// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/app/builder/piece-properties/text-input-with-mentions/tiptap-editor',
  () => ({
    TiptapEditor: ({ id }: { id?: string }) => (
      <div id={id} data-testid="editor" />
    ),
  }),
);

import {
  FormFieldMentionInput,
  TextInputWithMentions,
} from '@/app/builder/piece-properties/text-input-with-mentions';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';

function Harness({ children }: { children: ReactNode }) {
  const form = useForm({ defaultValues: { value: '' } });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="value"
        render={() => <>{children}</>}
      />
    </Form>
  );
}

const noop = () => undefined;

describe('FormFieldMentionInput', () => {
  it('gives the editor the id its FormLabel points at', () => {
    render(
      <Harness>
        <FormItem>
          <FormLabel>Key</FormLabel>
          <FormFieldMentionInput onChange={noop} />
        </FormItem>
      </Harness>,
    );

    const label = screen.getByText('Key');
    if (!(label instanceof HTMLLabelElement)) {
      throw new Error('FormLabel did not render a <label>');
    }

    expect(label.htmlFor).not.toBe('');
    expect(label.htmlFor).toBe(screen.getByTestId('editor').id);
  });

  it('leaves TextInputWithMentions free of form context', () => {
    render(<TextInputWithMentions onChange={noop} />);

    expect(screen.getByTestId('editor').id).toBe('');
  });
});
