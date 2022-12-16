
export class Variable {
  key: string;
  value: any;

  constructor(key: string, value: any) {
    this.validate(key);
    this.key = key;
    this.value = value;
  }

  validate(key: string) {
    if (!key) {
      throw Error('Variable "key" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): Variable {
    return new Variable(jsonData['key'], jsonData['value']);
  }
}
