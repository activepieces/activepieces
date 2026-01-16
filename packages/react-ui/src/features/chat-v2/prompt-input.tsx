import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface PromptInputProps {
    onMessageSend: (message: string) => void;
    loading?: boolean;
    readOnly?: boolean;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    onClick?: () => void;
    onFocus?: () => void;
}

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(({
    onMessageSend,
    loading = false,
    readOnly = false,
    value,
    onChange,
    placeholder = "Ask Quick...",
    onClick,
    onFocus
}, ref) => {
    const [message, setMessage] = useState('');
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Update internal state when value prop changes
    useEffect(() => {
        if (value !== undefined) {
            setMessage(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setMessage(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleSend = () => {
        if (message.trim() && !loading) {
            onMessageSend(message.trim());
            setMessage('');
        }
    };

    const handleContainerClick = () => {
        if (!readOnly) {
            internalRef.current?.focus();
            if (onClick) onClick();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (onFocus) onFocus();
    };

    return (
        <div className="flex flex-col w-full">
            <div className="relative">
                <div className={`h-[155px] w-full p-[1px] rounded-lg border border-input-border`} onClick={handleContainerClick}>
                    <div className={cn("relative rounded-md bg-background w-full h-full flex flex-col justify-between")}>
                        <div className="p-2 pb-0 flex-grow flex flex-col">
                            <Textarea
                                ref={ref || internalRef}
                                className="w-full bg-background border-none resize-none overflow-hidden flex-grow"
                                placeholder={placeholder}
                                minRows={10}
                                maxRows={4}
                                value={message}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onFocus={handleFocus}
                                readOnly={readOnly}
                            />
                        </div>
                        <div className="flex justify-end mx-2 mb-3">
                            <Button
                                variant="default"
                                size="icon"
                                onClick={handleSend}
                                loading={loading}
                                disabled={!message.trim() || loading || readOnly}
                            >
                                <ArrowUp className="w-5 h-5 stroke-[3px] text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

PromptInput.displayName = "PromptInput";

export default PromptInput;

