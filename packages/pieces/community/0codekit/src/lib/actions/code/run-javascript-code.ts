import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitCode } from '../../common/code';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const runJavascriptCodeAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'run_javascript_code',
    classification: 'WRITE',
    displayName: 'Run Javascript Code',
    description:
        'Run JavaScript in a 0CodeKit sandbox (Bun runtime); what it returns is under Result. Each run costs 50 credits and is limited to 180 seconds.',
    audience: 'both',
    aiMetadata: {
        description:
            'Execute JavaScript on the 0CodeKit Bun sandbox. Returns `{ result }`, where `result` is the value produced by a top-level `return` or the global `result` variable (null when nothing is returned). npm packages load through `require` and install automatically. Use for computations or libraries you cannot do directly; each call costs 50 credits, runs for at most 180 seconds, and repeats any side effects the code has.',
        idempotent: false,
    },
    props: {
        instructions: Property.MarkDown({
            value: 'Send data back with a top-level `return` or by setting the global `result` variable. Later steps find it under **Result**. `console.log` output is discarded. Load npm packages with `require`; they are installed for you.',
        }),
        code: Property.LongText({
            displayName: 'Code',
            description: 'The JavaScript to run. Return the value you want to use later.',
            required: true,
            placeholder: 'return { total: inputs.a + 1 };',
        }),
        inputs: zeroCodeKitCode.inputsProp({ variable: 'inputs' }),
        dependencies: zeroCodeKitCode.dependenciesProp(),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.codeResult,
    async run({ auth, propsValue }) {
        const dependencies = zeroCodeKitCode.stringList(propsValue.dependencies);
        const body = await zeroCodeKitCode.execute({
            apiKey: auth.secret_text,
            path: '/code/javascript',
            body: {
                code: zeroCodeKitCode.withJavascriptInputs({ code: propsValue.code, inputs: propsValue.inputs }),
                ...(dependencies.length > 0 ? { dependencies } : {}),
            },
        });
        return zeroCodeKitCode.javascriptResult(body);
    },
});
