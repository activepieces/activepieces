export enum CollectionStateEnum {
  NONE = 0,
  SAVING_FLOW = 1 << 0,
  SAVING_COLLECTION = 1 << 2,
  FAILED_SAVING_OR_PUBLISHING = 1 << 3,
  PUBLISHING = 1 << 4,
}
