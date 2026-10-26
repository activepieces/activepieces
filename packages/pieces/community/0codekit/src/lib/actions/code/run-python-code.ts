import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitCode } from '../../common/code';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const runPythonCodeAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'run_python_code',
    classification: 'WRITE',
    displayName: 'Run Python Code',
    description:
        'Run Python in a 0CodeKit sandbox; the value of `result` is under Result. Each run costs 50 credits (the free plan includes 250 credits a month) and is limited to 180 seconds.',
    audience: 'both',
    aiMetadata: {
        description:
            'Execute Python (CPython) on the 0CodeKit sandbox. Returns `{ result }`, where `result` is the value assigned to the global `result` variable (null when nothing is assigned). List PyPI packages in Libraries so they are installed before the run. Use for computations or libraries you cannot do directly; each call costs 50 credits, runs for at most 180 seconds, and repeats any side effects the code has.',
        idempotent: false,
    },
    props: {
        instructions: Property.MarkDown({
            value: 'Send data back by assigning it to the global `result` variable. Later steps find it under **Result**. `print` output is discarded. Each run costs **50 credits** and is limited to 180 seconds.',
        }),
        code: Property.LongText({
            displayName: 'Code',
            description: 'The Python to run. Assign the value you want back to `result`.',
            required: true,
            placeholder: 'result = {"total": inputs["a"] + 1}',
        }),
        inputs: zeroCodeKitCode.inputsProp({ variable: 'inputs' }),
        requirements: Property.Array({
            displayName: 'Libraries',
            description: 'Every PyPI package your code imports; auto-detection is unreliable.',
            required: false,
            placeholder: 'pandas==2.2.2',
        }),
        dependencies: zeroCodeKitCode.dependenciesProp(),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.codeResult,
    async run({ auth, propsValue }) {
        const requirements = zeroCodeKitCode.stringList(propsValue.requirements);
        const dependencies = zeroCodeKitCode.stringList(propsValue.dependencies);
        const body = await zeroCodeKitCode.execute({
            apiKey: auth.secret_text,
            path: '/code/python',
            body: {
                code: zeroCodeKitCode.withPythonInputs({ code: propsValue.code, inputs: propsValue.inputs }),
                ...(requirements.length > 0 ? { requirements } : {}),
                ...(dependencies.length > 0 ? { dependencies } : {}),
            },
        });
        return zeroCodeKitCode.pythonResult(body);
    },
});
