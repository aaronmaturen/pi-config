---
name: ticket-explainer
description: "Explain what work is needed for a JIRA ticket in plain language. Fetches ticket details from JIRA, searches GitHub for related PRs and commits, identifies affected code areas, and produces a plain-English breakdown with acceptance criteria, task checklist, and suggested first steps. Requires jira and gh CLIs. Usage: /skill:ticket-explainer PROJ-1234"
---

# Ticket Explainer

Explain what work is needed for a JIRA ticket in plain language, pulling context from JIRA, GitHub, and the latest code on `main`. Surfaces related PRs, affected files, and direct links to relevant GitHub resources.

**Ticket ID:** $ARGUMENTS

## Process:

### 1. **Validate Input**

```bash
if [[ -z "$ARGUMENTS" ]]; then
    echo "❌ No JIRA ticket ID provided."
    echo ""
    echo "Usage: /skill:ticket-explainer PROJ-1234"
    echo ""
    echo "Provide a JIRA issue key and I'll explain:"
    echo "  - What the ticket is asking for"
    echo "  - Where in the codebase the work lives"
    echo "  - Related PRs and GitHub history"
    echo "  - A plain-English breakdown of what needs to be done"
    exit 1
fi

TICKET_ID="$ARGUMENTS"
echo "🎫 Fetching details for: $TICKET_ID"
```

### 2. **Sync with Latest Main**

```bash
echo "🔄 Syncing with latest main..."

CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Fetch latest without switching branches
git fetch origin main --quiet

# Show how far behind we are (if on a feature branch)
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [[ "$BEHIND" -gt 0 ]]; then
    echo "⚠️  Current branch is $BEHIND commit(s) behind origin/main"
fi

# Get the latest commit on main for context
MAIN_SHA=$(git rev-parse origin/main)
MAIN_DATE=$(git log -1 --format="%ci" origin/main)
echo "✅ Latest main: ${MAIN_SHA:0:8} (${MAIN_DATE})"
```

### 3. **Fetch Ticket Details from JIRA**

```bash
echo "📋 Fetching JIRA ticket details..."

jira issue view "$TICKET_ID" --output json > /tmp/ticket_details.json 2>/dev/null

if [[ $? -ne 0 ]]; then
    echo "⚠️  Could not fetch JIRA ticket. Check that:"
    echo "   - '$TICKET_ID' is a valid JIRA issue key"
    echo "   - You are authenticated: run 'jira init'"
    exit 1
fi

# Extract key fields
SUMMARY=$(jq -r '.fields.summary // "No summary"' /tmp/ticket_details.json)
DESCRIPTION=$(jq -r '.fields.description // "No description provided"' /tmp/ticket_details.json)
STATUS=$(jq -r '.fields.status.name // "Unknown"' /tmp/ticket_details.json)
ISSUE_TYPE=$(jq -r '.fields.issuetype.name // "Issue"' /tmp/ticket_details.json)
PRIORITY=$(jq -r '.fields.priority.name // "None"' /tmp/ticket_details.json)
ASSIGNEE=$(jq -r '.fields.assignee.displayName // "Unassigned"' /tmp/ticket_details.json)
REPORTER=$(jq -r '.fields.reporter.displayName // "Unknown"' /tmp/ticket_details.json)
CREATED=$(jq -r '.fields.created // ""' /tmp/ticket_details.json)
UPDATED=$(jq -r '.fields.updated // ""' /tmp/ticket_details.json)
LABELS=$(jq -r '[.fields.labels[]? ] | join(", ")' /tmp/ticket_details.json 2>/dev/null || echo "None")
COMPONENTS=$(jq -r '[.fields.components[]?.name] | join(", ")' /tmp/ticket_details.json 2>/dev/null || echo "None")
ACCEPTANCE_CRITERIA=$(jq -r '.fields.customfield_10100 // ""' /tmp/ticket_details.json 2>/dev/null || echo "")
STORY_POINTS=$(jq -r '.fields.story_points // .fields.customfield_10016 // "Not estimated"' /tmp/ticket_details.json 2>/dev/null || echo "Not estimated")

# Fetch comments for additional context
jira issue comment list "$TICKET_ID" --output json > /tmp/ticket_comments.json 2>/dev/null || echo "[]" > /tmp/ticket_comments.json

echo "✅ Ticket: $SUMMARY"
echo "   Type: $ISSUE_TYPE | Status: $STATUS | Priority: $PRIORITY"
```

### 4. **Find Related GitHub Activity**

```bash
echo ""
echo "🔍 Searching GitHub for related activity..."

# Detect GitHub repo from git remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REMOTE_URL" =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
    GH_OWNER="${BASH_REMATCH[1]}"
    GH_REPO="${BASH_REMATCH[2]}"
    GH_REPO_FULL="$GH_OWNER/$GH_REPO"
    echo "📦 Repository: $GH_REPO_FULL"
else
    echo "⚠️  Could not detect GitHub repository from remote URL: $REMOTE_URL"
    GH_REPO_FULL=""
fi

if [[ -n "$GH_REPO_FULL" ]]; then
    # Open PRs mentioning this ticket
    gh pr list \
        --repo "$GH_REPO_FULL" \
        --search "$TICKET_ID" \
        --json number,title,state,url,author,createdAt,headRefName \
        --limit 10 \
        > /tmp/ticket_prs_open.json 2>/dev/null || echo "[]" > /tmp/ticket_prs_open.json

    # Merged PRs
    gh pr list \
        --repo "$GH_REPO_FULL" \
        --search "$TICKET_ID" \
        --state merged \
        --json number,title,state,url,author,createdAt,mergedAt,headRefName \
        --limit 10 \
        > /tmp/ticket_prs_merged.json 2>/dev/null || echo "[]" > /tmp/ticket_prs_merged.json

    OPEN_PR_COUNT=$(jq 'length' /tmp/ticket_prs_open.json)
    MERGED_PR_COUNT=$(jq 'length' /tmp/ticket_prs_merged.json)
    echo "   Found: $OPEN_PR_COUNT open PR(s), $MERGED_PR_COUNT merged PR(s)"

    # Commits on main referencing the ticket
    git log origin/main --oneline --grep="$TICKET_ID" --since="6 months ago" \
        > /tmp/ticket_commits.txt 2>/dev/null || touch /tmp/ticket_commits.txt

    # Branches named after this ticket
    git branch -r --list "*${TICKET_ID}*" 2>/dev/null > /tmp/ticket_branches.txt || touch /tmp/ticket_branches.txt
fi
```

### 5. **Identify Affected Code Areas**

```bash
# Files from merged PRs
if [[ -n "$GH_REPO_FULL" ]] && [[ "$MERGED_PR_COUNT" -gt 0 ]]; then
    jq -r '.[].number' /tmp/ticket_prs_merged.json | while read PR_NUM; do
        gh pr view "$PR_NUM" \
            --repo "$GH_REPO_FULL" \
            --json files \
            --jq '.files[].path' 2>/dev/null | head -20
    done
fi

# Inline references to ticket ID in source files
git grep -n "$TICKET_ID" origin/main -- \
    '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.html' '*.css' '*.scss' \
    2>/dev/null | head -20 > /tmp/ticket_inline_refs.txt || touch /tmp/ticket_inline_refs.txt
```

### 6. **Generate Explanation**

Using all gathered data, produce a clear plain-language explanation:

---

## 🎫 Ticket: [TICKET_ID] — [SUMMARY]

> **[ISSUE_TYPE]** · **[STATUS]** · **[PRIORITY] Priority** · [STORY_POINTS] points
> Reported by [REPORTER] · Assigned to [ASSIGNEE]
> Created [CREATED] · Last updated [UPDATED]

---

### 📌 What This Ticket Is About

[Translate the JIRA description into plain language. Explain:

- The user-facing or system problem this addresses
- Why it matters (business or user impact)
- Any constraints or context from the description or comments]

---

### ✅ Acceptance Criteria

**From JIRA:**

- AC 1: [criterion]
- AC 2: [criterion]

**Inferred (not explicitly stated — confirm with team):**

- [ ] [implied criterion based on description]

---

### 🧭 Where the Work Lives

| Area                       | Files / Modules      | Confidence          |
| -------------------------- | -------------------- | ------------------- |
| [e.g., Frontend component] | `src/components/...` | High / Medium / Low |
| [e.g., API endpoint]       | `api/endpoints/...`  | High / Medium / Low |

> 💡 Confidence based on: PR history, commit references, component labels, description keywords.

---

### 🔗 Related GitHub Activity

#### Open PRs

- **[#NUMBER] [Title]** — by @[author] — [URL]
  Branch: `[headRefName]` · Opened [createdAt]

#### Merged PRs

- **[#NUMBER] [Title]** — by @[author] — [URL]
  Merged [mergedAt]

#### Related Commits on Main

[List from /tmp/ticket_commits.txt]

#### Branches

[List from /tmp/ticket_branches.txt]

---

### 🛠️ What Needs to Be Done

#### Backend

- [ ] [Specific task]

#### Frontend

- [ ] [Specific task]

#### Tests

- [ ] [Specific task]

#### Other

- [ ] [e.g., Update API docs, add feature flag]

---

### ⚠️ Things to Watch Out For

[Surface risks, edge cases, or unknowns based on ticket, PRs, and codebase scan:]

- Unclear AC — confirm with [REPORTER]
- Related open PRs may conflict — review before branching
- Inline TODO comments found — check if still relevant

---

### 💬 Recent Comments

[Summarize last 3–5 JIRA comments for context — decisions made, blockers raised]

---

### 🚀 Suggested First Steps

1. Pull latest main: `git checkout main && git pull origin main`
2. Create a branch: `git checkout -b [ticket-id-lowercase]-[short-description]`
3. Review any open PRs for this ticket before starting
4. [First concrete code action based on analysis]

---

## Notes:

- Requires JIRA CLI (`jira`) authenticated via `jira init`
- Requires GitHub CLI (`gh`) authenticated via `gh auth login`
- Fetches `origin/main` via `git fetch` — does not switch branches or modify working tree
- If no GitHub activity exists yet, "Where the Work Lives" is based on component labels and description analysis only
