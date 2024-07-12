import { AppConnectionStatus } from "@activepieces/shared";
import {
    CheckCircledIcon,
    CrossCircledIcon,
} from "@radix-ui/react-icons";

function StatusIcon({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-center">
            <div className="mr-2">
                <Icon className="h-4 w-4" /> 
            </div>
            <div>{text}</div>
        </div>
    );
}

export default function AppConnectionStatusComponent({ status }: { status: AppConnectionStatus }) {
    switch (status) {
        case AppConnectionStatus.ACTIVE:
            return <StatusIcon icon={CheckCircledIcon} text="Active" />;
        case AppConnectionStatus.ERROR:
            return <StatusIcon icon={CrossCircledIcon} text="Error" />;
    }
}
