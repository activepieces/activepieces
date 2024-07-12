import { FlowRunStatus } from "@activepieces/shared";
import {
    CheckCircledIcon,
    CrossCircledIcon,
    QuestionMarkCircledIcon,
    StopwatchIcon,
} from "@radix-ui/react-icons";

function StatusIcon({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="ap-flex ap-items-center">
            <div className="ap-mr-2">
                <Icon className="ap-h-4 ap-w-4" /> 
            </div>
            <div>{text}</div>
        </div>
    );
}

export default function FlowRunStatusComponent({ status }: { status: FlowRunStatus }) {
    switch (status) {
        case FlowRunStatus.RUNNING:
            return <StatusIcon icon={StopwatchIcon} text="Running" />;
        case FlowRunStatus.SUCCEEDED:
            return <StatusIcon icon={CheckCircledIcon} text="Succeeded" />;
        case FlowRunStatus.STOPPED:
            return <StatusIcon icon={CheckCircledIcon} text="Stopped" />;
        case FlowRunStatus.FAILED:
            return <StatusIcon icon={CrossCircledIcon} text="Failed" />;
        case FlowRunStatus.PAUSED:
            return <StatusIcon icon={QuestionMarkCircledIcon} text="Paused" />;
        case FlowRunStatus.QUOTA_EXCEEDED:
            return <StatusIcon icon={CrossCircledIcon} text="Quota Exceeded" />;
        case FlowRunStatus.INTERNAL_ERROR:
            return <StatusIcon icon={CrossCircledIcon} text="Internal Error" />;
        case FlowRunStatus.TIMEOUT:
            return <StatusIcon icon={CrossCircledIcon} text="Timeout" />;
    }
}
