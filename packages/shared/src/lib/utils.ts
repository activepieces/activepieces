
//create a generic error class
export class UnhandledSwitchCaseError extends Error {
    constructor(
        public readonly value: never,
    ) {
        super(
            `Unhandled switch case. Value: ${JSON.stringify(
                value,
            )}`,
        )
    }
    
}
