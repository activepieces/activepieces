"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.spreadIfDefined = exports.spreadIfNotUndefined = void 0;
exports.deleteProperties = deleteProperties;
exports.omit = omit;
exports.deleteProps = deleteProps;
exports.sanitizeObjectForPostgresql = sanitizeObjectForPostgresql;
exports.applyFunctionToValuesSync = applyFunctionToValuesSync;
exports.applyFunctionToValues = applyFunctionToValues;
exports.groupBy = groupBy;
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function deleteProperties(obj, props) {
    const copy = Object.assign({}, obj);
    for (const prop of props) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete copy[prop];
    }
    return copy;
}
function omit(obj, keysToOmit) {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToOmit.includes(key)));
}
const spreadIfNotUndefined = (key, value) => {
    if (value === undefined) {
        return {};
    }
    return {
        [key]: value,
    };
};
exports.spreadIfNotUndefined = spreadIfNotUndefined;
const spreadIfDefined = (key, value) => {
    if ((0, utils_1.isNil)(value)) {
        return {};
    }
    return {
        [key]: value,
    };
};
exports.spreadIfDefined = spreadIfDefined;
function deleteProps(obj, prop) {
    const newObj = Object.assign({}, obj);
    for (const p of prop) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newObj[p];
    }
    return newObj;
}
function sanitizeObjectForPostgresql(input) {
    return applyFunctionToValuesSync(input, (str) => {
        if ((0, utils_1.isString)(str)) {
            // eslint-disable-next-line no-control-regex
            const controlCharsRegex = /\u0000/g;
            return str.replace(controlCharsRegex, '');
        }
        return str;
    });
}
function applyFunctionToValuesSync(obj, apply) {
    if ((0, utils_1.isNil)(obj)) {
        return obj;
    }
    else if ((0, utils_1.isString)(obj)) {
        return apply(obj);
    }
    else if (Array.isArray(obj)) {
        return obj.map(item => applyFunctionToValuesSync(item, apply));
    }
    else if ((0, exports.isObject)(obj)) {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, applyFunctionToValuesSync(value, apply)]));
    }
    return obj;
}
function applyFunctionToValues(obj, apply) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((0, utils_1.isNil)(obj)) {
            return obj;
        }
        else if ((0, utils_1.isString)(obj)) {
            return (yield apply(obj));
        }
        else if (Array.isArray(obj)) {
            // Create a new array and map over it with Promise.all
            const newArray = yield Promise.all(obj.map(item => applyFunctionToValues(item, apply)));
            return newArray;
        }
        else if ((0, exports.isObject)(obj)) {
            // Use Object.fromEntries and map entries asynchronously
            const newEntries = yield Promise.all(Object.entries(obj).map((_a) => tslib_1.__awaiter(this, [_a], void 0, function* ([key, value]) { return [key, yield applyFunctionToValues(value, apply)]; })));
            return Object.fromEntries(newEntries);
        }
        return obj;
    });
}
const isObject = (obj) => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};
exports.isObject = isObject;
function groupBy(items, keySelector) {
    const result = {};
    for (const item of items) {
        const key = keySelector(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
}
//# sourceMappingURL=object-utils.js.map