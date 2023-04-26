export enum BuilderStateEnum {
  NONE = 0,
  SAVING_FLOW = 1 << 0,
  FAILED_SAVING_OR_PUBLISHING = 1 << 3,
  PUBLISHING = 1 << 4,
}
