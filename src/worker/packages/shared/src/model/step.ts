import {Action} from "./action";

export interface Step<T, V>{
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: Action<any, any>;
}
