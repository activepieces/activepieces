import { FlowTrigger } from "../../types/flow-outline";
import { Scenario } from "../../types/scenario";

export class NewRowGoogleSheetsSendSlackMessage implements Scenario<FlowTrigger> {
    title = "New Row Google Sheets Send Slack Message";

    scenario() {
        return "When a new row is added to a Google Sheets spreadsheet, send a message to a Slack channel.";
    }

    eval(flowOutline: FlowTrigger) {
        return {
            success: true,
            message: "Scenario passed"
        };
    }
}