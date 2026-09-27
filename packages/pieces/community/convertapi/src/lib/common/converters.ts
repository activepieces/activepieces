import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { InputProperty, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { CONVERTAPI_BASE_URL } from './client';
import { ConverterInfo, ConverterParameter } from './types';

async function fetchConverters({ from, to }: { from?: string; to?: string } = {}): Promise<ConverterInfo[]> {
    const url =
        from === undefined
            ? `${CONVERTAPI_BASE_URL}/info`
            : `${CONVERTAPI_BASE_URL}/info/${encodeURIComponent(from)}/to/${to === undefined ? '*' : encodeURIComponent(to)}`;
    const response = await httpClient.sendRequest<unknown>({
        method: HttpMethod.GET,
        url,
    });
    return parseConverters(response.body);
}

async function fetchConverter({ from, to }: { from: string; to: string }): Promise<ConverterInfo> {
    const converters = await fetchConverters({ from, to });
    const match = converters.find(
        (converter) => sourceOf(converter) === from.toLowerCase() && destinationOf(converter) === to.toLowerCase(),
    );
    if (match === undefined) {
        throw new Error(`ConvertAPI has no converter from "${from}" to "${to}".`);
    }
    return match;
}

function parseConverters(body: unknown): ConverterInfo[] {
    if (!Array.isArray(body)) {
        return [];
    }
    return body.flatMap((item) => {
        const converter = toConverterInfo(item);
        return converter === undefined ? [] : [converter];
    });
}

function sourceOptions(converters: ConverterInfo[]): DropdownOption[] {
    const extensionsBySource = new Map<string, Set<string>>();
    for (const converter of converters) {
        if (mainInputOf(converter) === undefined) {
            continue;
        }
        const source = sourceOf(converter);
        const extensions = extensionsBySource.get(source) ?? new Set<string>();
        for (const extension of converter.SourceExtensions ?? []) {
            extensions.add(extension.toLowerCase());
        }
        extensionsBySource.set(source, extensions);
    }
    return [...extensionsBySource.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([source, extensions]) => ({
            label: formatLabel({ format: source, extensions: [...extensions] }),
            value: source,
        }));
}

function destinationOptions({ converters, from }: { converters: ConverterInfo[]; from: string }): DropdownOption[] {
    const seen = new Set<string>();
    return converters
        .filter((converter) => sourceOf(converter) === from.toLowerCase() && mainInputOf(converter) !== undefined)
        .flatMap((converter) => {
            const destination = destinationOf(converter);
            if (seen.has(destination)) {
                return [];
            }
            seen.add(destination);
            return [{ label: titleOf(converter), value: destination }];
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

function mainInputOf(converter: ConverterInfo): MainInput | undefined {
    const parameters = parametersOf(converter);
    const single = parameters.find((parameter) => parameter.Name === 'File' && parameter.Type === 'File');
    if (single !== undefined) {
        return { name: 'File', multiple: single.Array === true };
    }
    const multiple = parameters.find((parameter) => parameter.Name === 'Files' && parameter.Type === 'File');
    if (multiple !== undefined) {
        return { name: 'Files', multiple: true };
    }
    return undefined;
}

function optionProps(converter: ConverterInfo): InputPropertyMap {
    return Object.fromEntries(
        parametersOf(converter).flatMap((parameter) => {
            const property = toOptionProperty(parameter);
            return property === undefined ? [] : [[parameter.Name, property]];
        }),
    );
}

function toOptionProperty(parameter: ConverterParameter): InputProperty | undefined {
    if (EXCLUDED_PARAMETER_NAMES.has(parameter.Name) || parameter.Type === 'File' || parameter.Array === true) {
        return undefined;
    }
    const shared = {
        displayName: parameter.Label ?? parameter.Name,
        description: describeParameter(parameter),
        required: parameter.Required === true,
    };
    const defaultValue = parameter.Default;
    switch (parameter.Type) {
        case 'Collection': {
            const values = parameter.Values ?? {};
            return Property.StaticDropdown({
                ...shared,
                defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined,
                options: {
                    options: Object.entries(values).map(([value, label]) => ({ label, value })),
                },
            });
        }
        case 'Integer':
        case 'Double':
            return Property.Number({
                ...shared,
                defaultValue: typeof defaultValue === 'number' ? defaultValue : undefined,
            });
        case 'Bool':
            return Property.Checkbox({
                ...shared,
                defaultValue: typeof defaultValue === 'boolean' ? defaultValue : undefined,
            });
        default:
            return Property.ShortText({
                ...shared,
                defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined,
            });
    }
}

function describeParameter(parameter: ConverterParameter): string | undefined {
    const description = parameter.Description?.replace(/\s+/g, ' ').trim();
    if (description === undefined || description.length === 0) {
        return undefined;
    }
    return description;
}

function parametersOf(converter: ConverterInfo): ConverterParameter[] {
    return (converter.ConverterParameterGroups ?? [])
        .filter((group) => group.Name !== 'Authentication')
        .flatMap((group) => group.ConverterParameters);
}

function sourceOf(converter: ConverterInfo): string {
    return (converter.SourceFileFormats[0] ?? '').toLowerCase();
}

function destinationOf(converter: ConverterInfo): string {
    return (converter.DestinationFileFormats[0] ?? '').toLowerCase();
}

function titleOf(converter: ConverterInfo): string {
    const title = converter.Title?.replace(/\s+API$/i, '').trim();
    if (title !== undefined && title.length > 0) {
        return title;
    }
    return `${sourceOf(converter).toUpperCase()} to ${destinationOf(converter).toUpperCase()}`;
}

function formatLabel({ format, extensions }: { format: string; extensions: string[] }): string {
    const others = extensions.filter((extension) => extension !== format).sort();
    if (others.length === 0) {
        return format.toUpperCase();
    }
    return `${format.toUpperCase()} (${[format, ...others].map((extension) => `.${extension}`).join(', ')})`;
}

function toConverterInfo(item: unknown): ConverterInfo | undefined {
    if (!isRecord(item)) {
        return undefined;
    }
    const sources = toStringArray(item['SourceFileFormats']);
    const destinations = toStringArray(item['DestinationFileFormats']);
    if (sources.length === 0 || destinations.length === 0) {
        return undefined;
    }
    const groups = Array.isArray(item['ConverterParameterGroups']) ? item['ConverterParameterGroups'] : [];
    return {
        Name: typeof item['Name'] === 'string' ? item['Name'] : '',
        Title: typeof item['Title'] === 'string' ? item['Title'] : undefined,
        SourceFileFormats: sources,
        SourceExtensions: toStringArray(item['SourceExtensions']),
        DestinationFileFormats: destinations,
        DestinationExtensions: toStringArray(item['DestinationExtensions']),
        ConverterParameterGroups: groups.flatMap((group) => {
            if (!isRecord(group) || typeof group['Name'] !== 'string') {
                return [];
            }
            const parameters = Array.isArray(group['ConverterParameters']) ? group['ConverterParameters'] : [];
            return [
                {
                    Name: group['Name'],
                    ConverterParameters: parameters.flatMap((parameter) => {
                        const parsed = toConverterParameter(parameter);
                        return parsed === undefined ? [] : [parsed];
                    }),
                },
            ];
        }),
    };
}

function toConverterParameter(item: unknown): ConverterParameter | undefined {
    if (!isRecord(item) || typeof item['Name'] !== 'string' || typeof item['Type'] !== 'string') {
        return undefined;
    }
    const rawDefault = item['Default'];
    const rawValues = item['Values'];
    return {
        Name: item['Name'],
        Type: item['Type'],
        Label: typeof item['Label'] === 'string' ? item['Label'] : undefined,
        Description: typeof item['Description'] === 'string' ? item['Description'] : undefined,
        Required: item['Required'] === true,
        Array: item['Array'] === true,
        Default:
            typeof rawDefault === 'string' || typeof rawDefault === 'number' || typeof rawDefault === 'boolean'
                ? rawDefault
                : undefined,
        Values: isRecord(rawValues)
            ? Object.fromEntries(
                Object.entries(rawValues).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : [])),
            )
            : undefined,
    };
}

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((entry): entry is string => typeof entry === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const converterInfo = {
    fetchConverters,
    fetchConverter,
    parseConverters,
    sourceOptions,
    destinationOptions,
    mainInputOf,
    optionProps,
};

const EXCLUDED_PARAMETER_NAMES = new Set(['File', 'Files', 'StoreFile', 'Timeout', 'Secret', 'Token']);

type DropdownOption = {
    label: string;
    value: string;
};

export type MainInput = {
    name: 'File' | 'Files';
    multiple: boolean;
};
