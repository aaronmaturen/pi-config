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
└── skills/                   # Skills (8 total)
    ├── commit-msg/
    │   └── SKILL.md
    ├── pr-review/
    │   └── SKILL.md
    ├── implement-pr-feedback/
    │   └── SKILL.md
    ├── ticket-explainer/
    │   └── SKILL.md
    ├── bug-investigation/
    │   └── SKILL.md
    ├── feature-investigation/
    │   └── SKILL.md
    ├── spike-investigation/
    │   └── SKILL.md
    └── generate-slidedeck/
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
  "description": "Professional development workflow skills for pi",
  "keywords": ["pi-package"],
  "author": "Aaron Maturen <aaron@maturen.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/aaronmaturen/pi-config"
  },
  "pi": {
    "skills": ["./skills"]
  }
}
```

---

## Task Checklist

### Phase 1 — Scaffold ✅
- [x] Create `package.json`
- [x] Create `AGENTS.md` (project context for pi)
- [x] Create `README.md`
- [x] Create directory structure (`skills/`)

### Phase 2 — Skills: Dev Workflow (4 files) ✅
- [x] `skills/commit-msg/SKILL.md`
- [x] `skills/pr-review/SKILL.md`
- [x] `skills/implement-pr-feedback/SKILL.md`
- [x] `skills/ticket-explainer/SKILL.md`

### Phase 3 — Skills: Investigation (3 files)
- [ ] `skills/bug-investigation/SKILL.md`
- [ ] `skills/feature-investigation/SKILL.md`
- [ ] `skills/spike-investigation/SKILL.md`

### Phase 4 — Skills: Utilities (1 file)
- [ ] `skills/generate-slidedeck/SKILL.md`

### Phase 5 — Polish
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
| `/implement-pr-feedback` | `/skill:implement-pr-feedback` |
| `/ticket-explainer PRO-1234` | `/skill:ticket-explainer PRO-1234` |
| `/bug-investigation PRO-1234` | `/skill:bug-investigation PRO-1234` |
| `/feature-investigation PRO-1234` | `/skill:feature-investigation PRO-1234` |
| `/spike-investigation` | `/skill:spike-investigation` |
| `/generate-slidedeck` | `/skill:generate-slidedeck` |
