---
status: accepted
---

# Colour is numbered steps, with no semantic layer

## Decision

Five scales of twelve steps (`gray`, `accent`, `success`, `warning`, `danger`) plus six named
exceptions, and nothing in between. No `background`, no `muted-foreground`, no `destructive`.
Components write `bg-gray-1` and `text-gray-11`. The step table lives on the *colour* page under
`design-system`.

## Context

The previous layer was shadcn's role tokens — 67 `--color-*` entries such as `background`,
`muted-foreground`, `primary`, `destructive` and `border` — with dark mode as a `.dark` class plus 126
hand-written `dark:` overrides across 53 files. The names carried the rules and nothing checked them:
`text-destructive`, a button fill, was also body text at 146 call sites; the Enterprise "Talk to sales"
button rendered white on white in dark mode; the Activepieces wordmark was a raster that vanished on dark
grounds. A platform's `primaryColor` reached a handful of tokens, and most of the palette an admin could
configure was never read.

## Why

A rule that lives only in a name cannot be enforced. A step *range* is machine-checkable: `text-gray-3`
can be made impossible to write, and a class list that names both a ground and an ink can have the pair
measured against the real scale values. No naming scheme can do either.

The argument that lost was "names carry intent to reviewers". The names were there and guided nobody —
the evidence above is what they produced.

The cost accepted: changing "cards are step 2, not step 1" is a codemod over the call sites rather than
a one-line alias edit. That is rare and mechanical. The migration itself touched about 560 files.

## Consequences

The docs *are* the system, so the *colour* page has to stay correct — there is no longer a token name to
read intent from. In exchange the job table is checkable, and a scan against it is how the misplaced
`text-destructive` call sites were found. That scan is not in CI; the step table is enforced in review.
