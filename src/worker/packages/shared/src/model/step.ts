import {Action} from "./action";

export abstract class Step<T, V>{
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: Action<any, any>;
}
