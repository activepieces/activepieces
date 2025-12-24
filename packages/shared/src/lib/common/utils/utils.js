"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = isString;
exports.isNil = isNil;
exports.setAtPath = setAtPath;
exports.insertAt = insertAt;
exports.debounce = debounce;
exports.deepMergeAndCast = deepMergeAndCast;
exports.kebabCase = kebabCase;
exports.isEmpty = isEmpty;
exports.startCase = startCase;
exports.camelCase = camelCase;
exports.parseToJsonIfPossible = parseToJsonIfPossible;
exports.pickBy = pickBy;
exports.chunk = chunk;
exports.partition = partition;
exports.unique = unique;
const deepmerge_ts_1 = require("deepmerge-ts");
function isString(str) {
    return str != null && typeof str === 'string';
}
function isNil(value) {
    return value === null || value === undefined;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setAtPath(obj, path, value) {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined)
            acc[key] = {};
        if (i === pathArray.length - 1)
            acc[key] = value;
        return acc[key];
    }, obj);
}
function insertAt(array, index, item) {
    return [...array.slice(0, index), item, ...array.slice(index)];
}
function debounce(func, wait) {
    let timeout;
    let currentKey;
    return function (key, ...args) {
        const later = () => {
            func(...args);
        };
        if (currentKey === key) {
            clearTimeout(timeout);
        }
        currentKey = key;
        timeout = setTimeout(later, wait);
    };
}
/**
 * This function also merges arrays, x = [1, 2], y = [3, 4], z = deepMergeAndCast(x, y) -> [1, 2, 3, 4]
**/
function deepMergeAndCast(target, source) {
    return (0, deepmerge_ts_1.deepmerge)(target, source);
}
function kebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase by adding hyphen between lowercase and uppercase letters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/_/g, '-') // Replace underscores with hyphens
        .toLowerCase() // Convert to lowercase
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}
function isEmpty(value) {
    if (value == null) {
        return true;
    }
    if (typeof value === 'string' || Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }
    return false;
}
function startCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[a-z]/, match => match.toUpperCase())
        .replace(/\b[a-z]/g, match => match.toUpperCase());
}
function camelCase(str) {
    return str
        .replace(/([-_][a-z])/g, group => group.toUpperCase()
        .replace('-', '')
        .replace('_', ''));
}
function parseToJsonIfPossible(str) {
    try {
        return JSON.parse(str);
    }
    catch (e) {
        return str;
    }
}
function pickBy(object, predicate) {
    return Object.keys(object).reduce((result, key) => {
        if (predicate(object[key], key)) {
            result[key] = object[key];
        }
        return result;
    }, {});
}
function chunk(records, size) {
    const chunks = [];
    for (let i = 0; i < records.length; i += size) {
        chunks.push(records.slice(i, i + size));
    }
    return chunks;
}
function partition(array, predicate) {
    const truthy = [];
    const falsy = [];
    array.forEach((item, idx) => {
        if (predicate(item, idx, array)) {
            truthy.push(item);
        }
        else {
            falsy.push(item);
        }
    });
    return [truthy, falsy];
}
function unique(array) {
    return array.filter((item, index, self) => index === self.findIndex(other => JSON.stringify(other) === JSON.stringify(item)));
}
//# sourceMappingURL=utils.js.map