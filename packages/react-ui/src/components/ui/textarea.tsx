import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type Style = Omit<
  NonNullable<TextareaProps['style']>,
  'maxHeight' | 'minHeight'
> & {
  height?: number;
};
type TextareaHeightChangeMeta = {
  rowHeight: number;
};
interface TextareaAutosizeProps extends Omit<TextareaProps, 'style'> {
  maxRows?: number;
  minRows?: number;
  onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
  cacheMeasurements?: boolean;
  style?: Style;
}

export type ResizableTextareaProps = TextareaAutosizeProps &
  React.RefAttributes<HTMLTextAreaElement>;
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps & React.RefAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <TextareaAutosize
      cacheMeasurements={false}
      minRows={1}
      maxRows={5}
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
