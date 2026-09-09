export type DoclingErrorKind =
  | "AUTH"
  | "VALIDATION"
  | "SYNC_TIMEOUT"
  | "OVERLOADED"
  | "JOB_FAILED"
  | "BAD_FILE"
  | "DEADLINE";

export class DoclingError extends Error {
  constructor(
    public readonly kind: DoclingErrorKind,
    message: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "DoclingError";
  }
}
