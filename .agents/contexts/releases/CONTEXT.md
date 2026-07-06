# Releases & Environments

Promoting project state between environments and keeping it under version control.

## Language

**Project Release**:
A serialized snapshot of project state (flows, tables, connections) that can be imported/exported for environment promotion.
_Avoid_: deployment, snapshot

**Release Plan**:
A computed diff showing what would change if a release were applied — used for review before committing.
_Avoid_: sync plan, diff

**Git Sync**:
Bidirectional synchronization of published flows and tables with a Git repository branch.
_Avoid_: version control, git integration
