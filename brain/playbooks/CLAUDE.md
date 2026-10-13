<!-- craftspace:playbook-guide v1 -->

# Craftspace Playbooks

`brain/playbooks/` holds the team Playbooks that Craftspace loads for Cubie. `AGENTS.md` and
`CLAUDE.md` are the authoring guides for this directory. They are not Playbook packages.

Every other direct child must be a Playbook package directory:

~~~text
customer-research/
  playbook.json
  skills/
    interview-customers/
      SKILL.md
      attachments/
~~~

Use a Playbook when the team needs the same focused instructions, references, or starter files more than
once. `playbook.json` has `name`, `displayName`, and `description`. The package folder and manifest name
must match. Each Skill folder and its frontmatter `name` must match too.

For a repo-managed Playbook, change `brain/playbooks/<name>/` in a local checkout and open a pull
request. Craftspace reads it after merge and never writes it back. Do not call `upsert_playbook` for a
repo-managed Playbook.

<!-- /craftspace:playbook-guide -->
