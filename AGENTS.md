# pi-config

A pi package providing professional development workflow skills — JIRA-linked commit messages, PR review, investigation workflows, and more.

## Project Structure

```
pi-config/
├── package.json         # Pi package manifest
├── skills/              # One subdirectory per skill
│   └── <skill-name>/
│       └── SKILL.md     # Frontmatter + instructions
└── README.md
```

## Skill File Format

Every `SKILL.md` must begin with valid frontmatter:

```markdown
---
name: skill-name # Must match parent directory name exactly
description:
  ... # Specific, action-oriented, 1-2 sentences. This is what
  # the model reads to decide when to auto-load the skill.
---
```

**Description guidelines:**

- Be specific about _when_ to use this skill and what it produces
- Mention key inputs/outputs and external tools required (gh, jira, git)
- Bad: "Helps with commits"
- Good: "Generate a JIRA-linked conventional commit message from staged git changes. Extracts ticket from branch name (PRO-####, BUG-###), checks for new TODOs, and copies result to clipboard via pbcopy."

## Naming Rules

- Skill `name` must be lowercase letters, numbers, and hyphens only
- Must exactly match the parent directory name
- Examples: `commit-msg`, `bug-investigation`, `pr-review`

## External Tool Dependencies

Some skills require external CLIs. They should check gracefully and fail with a helpful message if missing:

- `gh` — GitHub CLI (`brew install gh && gh auth login`)
- `jira` — JIRA CLI (`brew install ankitpokhrel/jira-cli/jira-cli && jira init`)
- `pbcopy` — macOS clipboard (built-in on macOS; Linux users need `xclip`)

## Source Material

Skills are ported from `aaronmaturen/clair-de-config` (Claude Code plugin). When editing, preserve the original workflow logic but update any Claude Code-specific references (e.g., MCP/Context7) to use native pi tooling or bash equivalents.
