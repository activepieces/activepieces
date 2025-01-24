import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { ChatBubble, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';
import { CopilotAvatar } from '../copilot-avatar';
import { useBuilderStateContext } from '../../builder-hooks';
import { FlowOperationType } from '../../../../../../shared/src';
import { CodeBlockMessageContent } from '../types';
import { CodeEditor } from '@/app/builder/step-settings/code-settings/code-editor';

type PreviewCodeMessageProps = {
    message: CodeBlockMessageContent;
}

export const PreviewCodeMessage: React.FC<PreviewCodeMessageProps> = ({
    message
}) => {
    const [applyOperation, selectStepByName] = useBuilderStateContext((state) => [
        state.applyOperation,
        state.selectStepByName
    ]);
    const { code, operation } = message.content;

    const handleAccept = () => {
        applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: operation 
        })
        selectStepByName(operation.name)
    };

    return (
        <ChatBubble>
            <CopilotAvatar />
            <ChatBubbleMessage>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Generated Code</h3>
                    <CodeEditor
                        sourceCode={{ code, packageJson: '{}' }}
                        onChange={() => {}}
                        readonly={true}
                        hidePackageJson={true}
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="basic"
                        onClick={handleAccept}
                        className="text-success-300 hover:text-success flex items-center gap-2"
                    >
                        <CheckIcon className="h-4 w-4" />
                        Accept
                    </Button>
                </div>
            </ChatBubbleMessage>
        </ChatBubble>
    );
};
