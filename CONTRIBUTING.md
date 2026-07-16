<!-- omit in toc -->
# Contributing to Activepieces

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Contributing Guide](https://www.activepieces.com/docs/build-pieces/building-pieces/start-building) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for us maintainers and smooth out the experience for all involved. The community looks forward to your contributions. 🎉

> And if you like the project, but just don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
> - Star the project
> - Tweet about it
> - Refer this project in your project's readme
> - Mention the project at local meetups and tell your friends/colleagues

## Code review

We optimize for fast review without dropping quality. A few things speed your PR through:

- **Keep PRs small.** Aim for under ~400 changed lines. Small PRs get reviewed faster and catch more bugs. Split large work into a stack of dependent PRs rather than one big drop.
- **Green CI first.** Lint, build, tests, and migration checks must pass before a human reviews — reviewers look at PRs that are already green. Don't suppress lint to get there.
- **An AI reviewer does the first pass.** On team PRs, Claude posts an automated first-pass review (style, obvious bugs, security anti-patterns, test gaps) so humans can focus on design and intent. It's advisory — a human still approves. Fork PRs skip auto-review; a maintainer can trigger it with `@claude review`.
- **Risk lanes.** Changes under database, migrations, EE, authentication, `packages/core/shared`, or `.github` require a code-owner review (see [`.github/CODEOWNERS`](.github/CODEOWNERS)). These are never approved by AI alone.
- **Address the bot, then request human review.** Resolve or reply to the AI comments before a human picks it up — it keeps the human pass focused on judgment, not nits.

