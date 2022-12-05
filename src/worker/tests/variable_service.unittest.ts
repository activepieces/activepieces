import {VariableService} from '../src/services/variable-service';

const variableService = new VariableService();
const valuesMap = {
    "configs": {
        "price": 6.4,
        "msg": "Hello World",
        "foo": true
    },
    "steps": {
        "trigger": {
            "output": {
                "items": [5, "a"],
                "name": "John"
            }
        }
    }
};

test('Test resolve text with no variables', () => {
    expect(variableService.resolve("Hello world!", valuesMap)).toEqual("Hello world!");
});

test('Test resolve configs variables', () => {
    expect(variableService.resolve("${configs.msg}", valuesMap)).toEqual("Hello World");
});

test('Test resolve text with configs variables', () => {
    expect(variableService.resolve("Price is ${configs.price}", valuesMap)).toEqual("Price is 6.4");
});

test('Test resolve steps variables', () => {
    expect(variableService.resolve("${trigger.name}", valuesMap)).toEqual("John");
});

test('Test resolve multiple variables', () => {
    expect(variableService.resolve("${configs.msg} ${trigger.name}", valuesMap)).toEqual("Hello World John");
});

test('Test resolve variable array items', () => {
    expect(variableService.resolve("${trigger.items[0]} ${trigger.items[1]}", valuesMap)).toEqual("5 a");
});

test('Test resolve array variable', () => {
    expect(variableService.resolve("${trigger.items}", valuesMap)).toEqual([5, 'a']);
});

test('Test resolve text with array variable', () => {
    expect(variableService.resolve("items are ${trigger.items}", valuesMap)).toEqual("items are [5,\"a\"]");
});

test('Test resolve object variable', () => {
    expect(variableService.resolve("${trigger}", valuesMap)).toEqual({"items": [5, "a"], "name": "John"});
});

test('Test resolve text with object variable', () => {
    expect(variableService.resolve("values from trigger step: ${trigger}", valuesMap)).toEqual('values from trigger step: {\"items\":[5,\"a\"],\"name\":\"John\"}');
});

test('Test resolve integer from variables', () => {
    expect(variableService.resolve("${trigger.items[0]}", valuesMap)).toEqual(5);
});

test('Test resolve double from variables', () => {
    expect(variableService.resolve("${configs.price}", valuesMap)).toEqual(6.4);
});

test('Test resolve boolean from variables', () => {
    expect(variableService.resolve("${configs.foo}", valuesMap)).toEqual(true);
});

test('Test resolve text with undefined variables', () => {
    expect(variableService.resolve("test ${configs.bar} ${trigger.items[4]}", valuesMap)).toEqual("test  ");
});

test('Test resolve empty variable operator', () => {
    expect(variableService.resolve("${}", valuesMap)).toEqual("");
});

test('Test resolve incorrect variable format', () => {
    expect(variableService.resolve("${configs.msg", valuesMap)).toEqual("${configs.msg");
});

test('Test resolve empty text', () => {
    expect(variableService.resolve("", valuesMap)).toEqual("");
});

test('Test resolve object', () => {
    expect(variableService.resolve({
        "input": {
            "foo": "bar",
            "nums": [1, 2, "${trigger.items[0]}"],
            "var": "${configs.price}"
        }
    }, valuesMap)).toEqual({"input": {"foo": "bar", "nums": [1, 2, 5], "var": 6.4}});
});

test('Test resolve array', () => {
    expect(variableService.resolve([1, 'a', "${trigger.name}"], valuesMap)).toEqual([1, 'a', "John"]);
});
