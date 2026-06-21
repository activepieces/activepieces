# Draft/Published split with immutable locked versions

Editing always happens on a single editable DRAFT `FlowVersion`; publishing (`LOCK_AND_PUBLISH`) snapshots it into an immutable LOCKED version that `flow.publishedVersionId` points to, and only published flows can be enabled (triggers registered). We make locked versions immutable — rather than editing the running definition in place — so a production run always executes a stable, known graph and editing can continue safely in parallel; `USE_AS_DRAFT` copies a published version back to draft to resume editing.
