import { InputPropertyMap } from "@activepieces/pieces-framework";

function getMaxArrayLength(props: Record<string, unknown>, inputsName: string[]): number {
    return Math.max(
        ...inputsName.map(input => {
            const value = props[input];
            if (Array.isArray(value)) {
                return (value as any[]).length;
            } else if (typeof value === 'object' && value !== null) {
                return getMaxArrayLength(value as Record<string, unknown>, Object.keys(value) as string[]);
            }
            return 0;
        })
    );
}

function getValueForIndex<T>(props: T, input: keyof T, index: number): unknown {
    const value = props[input];

    if (Array.isArray(value)) {
        return value[index] !== undefined ? value[index] : undefined;
    } else if (typeof value === 'object' && value !== null) {
        const result: Record<string, unknown> = {};
        Object.keys(value).forEach(key => {
            result[key] = getValueForIndex(value as Record<string, unknown>, key, index);
        });
        return result;
    }

    return value;
}

function constructResultForIndex(props: Record<string, unknown>, inputsName: string[], index: number): Record<string, unknown> {
    return inputsName.reduce((result, input) => {
        (result[input] as unknown) = getValueForIndex(props, input, index);
        return result;
    }, { ...props });
}


export const bulkPayloadHelper = {
    flatPayloadRun: (props: InputPropertyMap, rawPayload: Record<string, unknown>) => {
        const inputsNameWithBulkMode = Object.entries(props).filter(([_, value]) => 'supportBulkMode' in value && value.supportBulkMode).map(([key, _]) => key);
        const maxLength = getMaxArrayLength(rawPayload, inputsNameWithBulkMode);
        return Array.from({ length: maxLength }, (_, index) =>
            constructResultForIndex(rawPayload, inputsNameWithBulkMode, index)
        );
    }
}
