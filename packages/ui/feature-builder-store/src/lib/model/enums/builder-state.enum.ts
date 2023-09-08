export enum BuilderSavingStatusEnum {
  NONE = 0,
  SAVING_FLOW = 1 << 0,
  FAILED_SAVING_OR_PUBLISHING = 1 << 3,
  PUBLISHING = 1 << 4,
  WAITING_TO_SAVE = 1 << 5,
}
