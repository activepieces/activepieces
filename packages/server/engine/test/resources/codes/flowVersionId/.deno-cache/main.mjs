
const __AP_TMP_DIR__ = "/var/folders/fz/hnl38_lx6xl9fhxb_967ns8h0000gn/T";
const toErrorPayload = (value) => {
    try {
        if (value instanceof Error) {
            let message = value.message
            const accessMatch = __AP_TMP_DIR__ !== null && typeof Deno !== 'undefined' && value.name === 'NotCapable'
                ? message.match(/Requires (read|write) access/)
                : null
            if (accessMatch) {
                const operation = accessMatch[1]
                const tmpGranted = Deno.permissions.querySync({ name: operation, path: __AP_TMP_DIR__ }).state === 'granted'
                if (operation === 'write') {
                    message += tmpGranted
                        ? '. Only os.tmpdir() is writable from a code step.'
                        : '. Writes are not available to a code step in this execution mode.'
                }
                else {
                    message += tmpGranted
                        ? ". Only os.tmpdir() and the step's own directory are readable from a code step."
                        : ". Only the step's own directory is readable by a code step in this execution mode."
                }
            }
            return { message, name: value.name, stack: value.stack }
        }
        if (typeof value === 'string') {
            return { message: value }
        }
        return { message: JSON.stringify(value) ?? String(value) }
    }
    catch {
        return { message: 'Code execution failed' }
    }
}
globalThis["flattenNestedKeys"] = function flattenNestedKeys(data, pathToMatch) {
	if (typeof data === "object" && data !== null && !Array.isArray(data)) {
		for (const [key, value] of Object.entries(data)) {
			if (key === pathToMatch[0]) {
				return flattenNestedKeys(value, pathToMatch.slice(1));
			}
		}
	} else if (Array.isArray(data)) {
		return data.flatMap((d) => flattenNestedKeys(d, pathToMatch));
	} else if (pathToMatch.length === 0) {
		return [data];
	};
	return [];
};

const print = console.log.bind(console);
const marker = '__AP_DENO_RESULT_' + crypto.randomUUID() + '__';
print("__AP_DENO_MARKER__" + marker);
const reply = (payload) => {
    print(marker + JSON.stringify(payload));
};

let failCurrentRun = null;
globalThis.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    if (failCurrentRun) {
        failCurrentRun(event.reason);
    }
    else {
        console.error('Unhandled rejection in deno session:', event.reason);
    }
});

const runScript = (script) => new Promise((resolve, reject) => {
    failCurrentRun = reject;
    Promise.resolve()
        .then(() => (0, eval)('(' + script + ')'))
        .then(async (value) => {
            await new Promise((tick) => setTimeout(tick, 0));
            resolve(value);
        })
        .catch(reject);
});

const decoder = new TextDecoder();
let buffered = '';
for await (const chunk of Deno.stdin.readable) {
    buffered += decoder.decode(chunk, { stream: true });
    let newline = buffered.indexOf('\n');
    while (newline !== -1) {
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        newline = buffered.indexOf('\n');
        if (line.trim() === '') {
            continue;
        }
        let command;
        try {
            command = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (command.kind === 'set') {
            globalThis[command.key] = command.value;
            reply({ id: command.id, success: true, result: null });
            continue;
        }
        try {
            const result = await runScript(command.script);
            reply({ id: command.id, success: true, result: result ?? null });
        }
        catch (error) {
            reply({ id: command.id, success: false, error: toErrorPayload(error) });
        }
        finally {
            failCurrentRun = null;
        }
    }
}
