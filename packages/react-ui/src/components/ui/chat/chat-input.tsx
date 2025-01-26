import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onSendMessage: (message: string) => void;
}

const TEXTAREA_MIN_HEIGHT = '61px';
const TEXTAREA_MAX_HEIGHT = '200px';

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onSendMessage, ...props }, ref) => {
    const [input, setInput] = React.useState('');

    return (
      <div className={cn('relative w-full mx-auto z-10')}>
        <div className="shadow-sm rounded-sm overflow-hidden backdrop-blur-sm bg-gray-100">
          <textarea
            ref={ref}
            className={cn(
              'w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-sm text-gray-900 placeholder-gray-500 bg-transparent',
              className
            )}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (event.shiftKey) return;
                event.preventDefault();
                onSendMessage(event.currentTarget.value);
                event.currentTarget.value = '';
                setInput('');

              }
            }}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            style={{
              minHeight: TEXTAREA_MIN_HEIGHT,
              maxHeight: TEXTAREA_MAX_HEIGHT,
            }}
            translate="no"
            {...props}
          />
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export { ChatInput };
