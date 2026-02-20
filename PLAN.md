# pi-config Migration Plan

Port `aaronmaturen/clair-de-config` (Claude Code plugin) to a pi package.

**Source repo:** `~/Projects/aaronmaturen/clair-de-config`
**Target repo:** `~/Projects/aaronmaturen/pi-config`

---

## Final Structure

```
pi-config/
├── package.json              # Pi package manifest (replaces .claude-plugin/plugin.json)
├── AGENTS.md                 # Project context (pi reads natively)
├── README.md
├── prompts/                  # Prompt templates (replaces *-expert.md commands)
│   ├── angular-expert.md
│   ├── django-expert.md
│   └── a11y-expert.md
└── skills/                   # Skills (replaces all other commands)
    ├── commit-msg/
    │   └── SKILL.md
    ├── pr-review/
    │   └── SKILL.md
    ├── bug-investigation/
    │   └── SKILL.md
    ├── feature-investigation/
    │   └── SKILL.md
    ├── spike-investigation/
    │   └── SKILL.md
    ├── implement-pr-feedback/
    │   └── SKILL.md
    ├── self-review/
    │   └── SKILL.md
    ├── summarize-branch/
    │   └── SKILL.md
    ├── scaffold/
    │   └── SKILL.md
    ├── simplify/
    │   └── SKILL.md
    ├── problem-solver/
    │   └── SKILL.md
    ├── git-revise-history/
    │   └── SKILL.md
    ├── generate-slidedeck/
    │   └── SKILL.md
    ├── ticket-explainer/
    │   └── SKILL.md
    ├── release-architect/
    │   └── SKILL.md
    ├── ai-agent-audit/
    │   └── SKILL.md
    ├── angular-architecture-audit/
    │   └── SKILL.md
    ├── angular-performance-audit/
    │   └── SKILL.md
    ├── angular-style-audit/
    │   └── SKILL.md
    ├── a11y-audit/
    │   └── SKILL.md
    ├── django-api-audit/
    │   └── SKILL.md
    ├── django-model-audit/
    │   └── SKILL.md
    └── django-security-audit/
        └── SKILL.md
```

---

## Conversion Rules

### Commands → Skills (23 files)

All multi-step workflow commands become skills. For each `commands/foo.md`:

1. Create `skills/foo/SKILL.md`
2. Add frontmatter:
   ```markdown
   ---
   name: foo
   description: <specific, action-oriented, 1-2 sentence description>
   ---
   ```
3. Keep all existing content below the frontmatter
4. Replace any Context7 MCP references (see "MCP" section below)
5. Verify `name` matches directory name (lowercase, hyphens only)

**Frontmatter description guidelines (critical for auto-loading):**
- Be specific about *when* to use this skill
- Mention key triggers: tool names, actions, artifact types
- Bad: `"Helps with commits"`
- Good: `"Generate a JIRA-linked conventional commit message from staged git changes. Extracts ticket from branch name (PRO-####, BUG-###), checks for new TODOs, copies result to clipboard."`

### Commands → Prompt Templates (3 files)

Expert mode commands set a persistent persona — better as prompt templates.

For each `commands/*-expert.md`:

1. Create `prompts/<name>-expert.md`
2. Add frontmatter:
   ```markdown
   ---
   description: <one-line description of the mode>
   ---
   ```
3. Keep all existing content below the frontmatter
4. User invokes with `/<name>-expert` (e.g., `/angular-expert`)

### MCP / Context7 References

Pi has no MCP support. Commands that reference Context7 for documentation search:
- `pr-review.md` — Step 7 "Search Documentation (context7)"
- `scaffold.md` — Uses Context7 for framework research

**Replace with:**
```markdown
**Documentation Research:** Use web search or `npx @upstash/context7-mcp` via bash
if available, otherwise use built-in knowledge and official documentation URLs.
```

> Note: brave-search from `github.com/badlogic/pi-skills` is a good companion package
> for users who want live web search. Can be called out in README.

### Plugin Manifest → package.json

Replace `.claude-plugin/plugin.json` with a `package.json` at the repo root:

```json
{
  "name": "@aaronmaturen/pi-config",
  "version": "1.0.0",
  "description": "Professional development workflow skills and prompt templates for pi",
  "keywords": ["pi-package"],
  "author": "Aaron Maturen <aaron@maturen.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/aaronmaturen/pi-config"
  },
  "pi": {
    "skills": ["./skills"],
    "prompts": ["./prompts"]
  }
}
```

---

## Task Checklist

### Phase 1 — Scaffold
- [ ] Create `package.json`
- [ ] Create `AGENTS.md` (project context for pi)
- [ ] Create `README.md`
- [ ] Create directory structure (`skills/`, `prompts/`)

### Phase 2 — Prompt Templates (3 files, quick)
- [ ] `prompts/angular-expert.md`
- [ ] `prompts/django-expert.md`
- [ ] `prompts/a11y-expert.md`

### Phase 3 — Skills: Dev Workflow (8 files)
- [ ] `skills/commit-msg/SKILL.md`
- [ ] `skills/pr-review/SKILL.md`
- [ ] `skills/implement-pr-feedback/SKILL.md`
- [ ] `skills/self-review/SKILL.md`
- [ ] `skills/summarize-branch/SKILL.md`
- [ ] `skills/scaffold/SKILL.md`
- [ ] `skills/git-revise-history/SKILL.md`
- [ ] `skills/ticket-explainer/SKILL.md`

### Phase 4 — Skills: Investigation (4 files)
- [ ] `skills/bug-investigation/SKILL.md`
- [ ] `skills/feature-investigation/SKILL.md`
- [ ] `skills/spike-investigation/SKILL.md`
- [ ] `skills/problem-solver/SKILL.md`

### Phase 5 — Skills: Audits (8 files)
- [ ] `skills/angular-style-audit/SKILL.md`
- [ ] `skills/angular-architecture-audit/SKILL.md`
- [ ] `skills/angular-performance-audit/SKILL.md`
- [ ] `skills/a11y-audit/SKILL.md`
- [ ] `skills/django-model-audit/SKILL.md`
- [ ] `skills/django-api-audit/SKILL.md`
- [ ] `skills/django-security-audit/SKILL.md`
- [ ] `skills/ai-agent-audit/SKILL.md`

### Phase 6 — Skills: Utilities (3 files)
- [ ] `skills/release-architect/SKILL.md`
- [ ] `skills/generate-slidedeck/SKILL.md`
- [ ] `skills/simplify/SKILL.md`

### Phase 7 — Polish
- [ ] Test install locally: `pi install ./` from repo root
- [ ] Verify all skill names match their directory names
- [ ] Verify all descriptions are specific enough for auto-loading
- [ ] Update README with pi-specific install instructions
- [ ] Tag v1.0.0

---

## Installation (once published)

```bash
# From git
pi install git:github.com/aaronmaturen/pi-config

# Local dev
pi install /Users/aaron/Projects/aaronmaturen/pi-config

# With companion web search skill
pi install git:github.com/badlogic/pi-skills
```

## Invocation Differences (Claude Code → Pi)

| Claude Code | Pi |
|---|---|
| `/commit-msg` | `/skill:commit-msg` |
| `/pr-review <url>` | `/skill:pr-review <url>` |
| `/angular-expert` | `/angular-expert` (prompt template, same!) |
| `/angular-style-audit --branch` | `/skill:angular-style-audit --branch` |
| `/bug-investigation PRO-1234` | `/skill:bug-investigation PRO-1234` |
