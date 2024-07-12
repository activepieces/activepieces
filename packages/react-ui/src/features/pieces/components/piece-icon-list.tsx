import { ActionType, PopulatedFlow, TriggerType, flowHelper } from "@activepieces/shared";
import { PieceIcon } from "./piece-icon";

export function PieceIconList({ flow }: { flow: PopulatedFlow }) {

    const steps = flowHelper.getAllSteps(flow.version.trigger).map((step) => {
        if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) {
            return step.settings.pieceName;
        }
        return null;
    }).filter((pieceName): pieceName is string => pieceName !== null).slice(0, 3);

    return <>
        <div className="ap-flex">
            {steps.map((pieceName, index) => <PieceIcon pieceName={pieceName} key={index} />)}
        </div>
    </>
}