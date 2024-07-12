import { FlowOperationType, FlowStatus, PopulatedFlow } from "@activepieces/shared";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { Switch } from "../../../components/ui/switch";
import { flowsApi } from "../lib/flows-api";

export default function FlowStatusToggle({ flow }: { flow: PopulatedFlow }) {
    const [isLoading, setIsLoading] = useState(false);

    const onCheckedChange = async (checked: boolean) => {
        setIsLoading(true);
        try {
            await flowsApi.applyOperation(flow.id, {
                type: FlowOperationType.CHANGE_STATUS,
                request: {
                    status: checked ? FlowStatus.ENABLED : FlowStatus.DISABLED,
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Switch
                            defaultChecked={flow.status === FlowStatus.ENABLED}
                            onCheckedChange={onCheckedChange}
                            disabled={isLoading}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {flow.status === FlowStatus.ENABLED ? 'Flow is on' : 'Flow is off'}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}