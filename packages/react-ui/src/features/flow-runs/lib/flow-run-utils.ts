import { CheckCircledIcon, CrossCircledIcon, StopwatchIcon } from "@radix-ui/react-icons"
import { FlowRunStatus } from "@activepieces/shared"
import { PauseCircleIcon } from "lucide-react"


export const flowRunUtils = {
    getStatusIcon(status: FlowRunStatus): { varient: 'default' | 'success' | 'error', icon: React.ComponentType } {
        switch (status) {
            case FlowRunStatus.RUNNING:
                return {
                    varient: 'success',
                    icon: StopwatchIcon
                }
            case FlowRunStatus.SUCCEEDED:
                return {
                    varient: 'success',
                    icon: CheckCircledIcon
                }
            case FlowRunStatus.STOPPED:
                return {
                    varient: 'success',
                    icon: CheckCircledIcon
                }
            case FlowRunStatus.FAILED:
                return {
                    varient: 'error',
                    icon: CrossCircledIcon
                }   
            case FlowRunStatus.PAUSED:
                return {
                    varient: 'default',
                    icon: PauseCircleIcon
                }
            case FlowRunStatus.QUOTA_EXCEEDED:
                return {
                    varient: 'error',
                    icon: CrossCircledIcon
                }
            case FlowRunStatus.INTERNAL_ERROR:
                return {
                    varient: 'error',
                    icon: CrossCircledIcon
                }
            case FlowRunStatus.TIMEOUT:
                return {
                    varient: 'error',
                    icon: CrossCircledIcon
                }
        }
    }
}