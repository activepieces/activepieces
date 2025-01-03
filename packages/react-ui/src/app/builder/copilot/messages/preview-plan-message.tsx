import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { FlowPlanMessageContnt } from '../types';
import { ChatBubble, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';
import { CopilotAvatar } from '../copilot-avatar';

type PreviewPlanMessageProps = {
    message: FlowPlanMessageContnt;
}
export const PreviewPlanMessage: React.FC<PreviewPlanMessageProps> = ({
    message
}) => {

    const handleAccept = () => {
    };

    const renderStep = (step: any, index: string) => {
        return (
            <div key={index} className="rounded-lg border bg-card p-3">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.type === 'router' && step.branches && (
                    <div className="mt-2 pl-4 border-l-2 border-muted">
                        {step.branches.map((branch: any, branchIndex: number) => (
                            <div key={branchIndex} className="mt-2">
                                <p className="text-sm font-medium">If: {branch.condition}</p>
                                <div className="pl-4">
                                    {branch.steps.map((branchStep: any, stepIndex: number) =>
                                        renderStep(branchStep, `${index}-${branchIndex}-${stepIndex}`)
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <ChatBubble>
            <CopilotAvatar />
            <ChatBubbleMessage >
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{message.content.name}</h3>
                        <p className="text-sm text-muted-foreground">{message.content.description}</p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium">Trigger</h4>
                        <div className="rounded-lg border bg-card p-3">
                            <p className="font-medium">{message.content.trigger.title}</p>
                            <p className="text-sm text-muted-foreground">{message.content.trigger.description}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium">Steps</h4>
                        <div className="space-y-2">
                            {message.content.steps.map((step, index) => renderStep(step, index.toString()))}
                        </div>
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
