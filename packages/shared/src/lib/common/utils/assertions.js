"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotUndefined = void 0;
exports.assertEqual = assertEqual;
exports.assertNotNullOrUndefined = assertNotNullOrUndefined;
exports.assertNotEqual = assertNotEqual;
exports.assertNull = assertNull;
exports.asserNotEmpty = asserNotEmpty;
function assertEqual(actual, expected, fieldName1, fieldName2) {
    if (actual !== expected) {
        throw new Error(`${fieldName1} and ${fieldName2} should be equal`);
    }
}
function assertNotNullOrUndefined(value, fieldName) {
    if (value === null || value === undefined) {
        throw new Error(`${fieldName} is null or undefined`);
    }
}
function assertNotEqual(value1, value2, fieldName1, fieldName2) {
    if (value1 === value2) {
        throw new Error(`${fieldName1} and ${fieldName2} should not be equal`);
    }
}
const isNotUndefined = (value) => {
    return value !== undefined;
};
exports.isNotUndefined = isNotUndefined;
function assertNull(value, fieldName) {
    if (value !== null) {
        throw new Error(`${fieldName} should be null`);
    }
}
function asserNotEmpty(value, fieldName) {
    assertNotNullOrUndefined(value, fieldName);
    if (value.length === 0) {
        throw new Error(`${fieldName} should be not empty`);
    }
}
//# sourceMappingURL=assertions.js.map