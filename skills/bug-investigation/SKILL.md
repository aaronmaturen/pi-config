---
name: bug-investigation
description: Investigate a bug using the 5 Whys root cause analysis technique. Fetches ticket details from JIRA (if a ticket ID is provided), checks for previous investigation reports, defines Fix Verification Criteria before digging in, traces the bug across frontend and backend repos, and generates a structured investigation report with timeline and recommendations. Requires jira CLI if using a ticket ID.
---

# Bug Investigation - 5 Whys Root Cause Analysis

Investigate a bug using the 5 Whys technique to identify root causes, then create a comprehensive analysis report.

**Bug ID:** $ARGUMENTS (JIRA issue key, e.g., BUG-1234 — or leave blank to describe manually)

## Philosophy: Verification-Driven Bug Fixing

**Why bugs "reopen":** Fixes are merged without explicit verification criteria, edge cases are missed, and regression tests aren't added.

**This skill ensures:**

1. Reproduction steps are verified BEFORE investigating
2. Fix Verification Criteria (FVC) are defined for every bug
3. Every fix must have a test that would have caught the bug
4. PR checklist maps to specific FVC

## Input Handling

If no JIRA bug ID is provided, prompt the user to describe the bug manually:

**Manual Investigation Mode:** When no JIRA ticket exists, the investigation will:

- Skip JIRA data fetching
- Use the provided description for initial problem analysis
- Create a manual bug ID based on description keywords
- Follow the same 5 Whys methodology
- Generate the same comprehensive documentation

## Investigation Process:

### 0. **Handle Input and Setup**

```bash
if [[ -z "$ARGUMENTS" ]]; then
    echo "🐛 No JIRA bug ID provided"
    echo ""
    echo "📝 Please describe the bug you're investigating:"
    echo "   - What is the issue/problem you're seeing?"
    echo "   - When did you first notice it?"
    echo "   - What steps reproduce the problem?"
    echo "   - What should happen vs what actually happens?"
    echo "   - Any error messages or symptoms?"
    echo "   - Which parts of the system seem affected?"
    exit 0
fi

BUG_ID="$ARGUMENTS"
echo "🎯 Investigating bug: $BUG_ID"

REPORT_BASE="${REPORT_BASE:-$HOME/Documents/technical-analysis}"
BUG_DIR="${REPORT_BASE}/bugs/${BUG_ID}"
REPORT_FILE="${BUG_DIR}/investigation.md"
TIMELINE_FILE="${BUG_DIR}/timeline.md"
RECOMMENDATIONS_FILE="${BUG_DIR}/recommendations.md"
```

### 1. **Check for Previous Investigation Findings**

```bash
if [[ -f "$REPORT_FILE" ]]; then
    echo "🔍 Found previous investigation for $BUG_ID"
    echo "📁 Location: $BUG_DIR"
    echo ""

    # Show summary of previous findings
    sed -n '/## Executive Summary/,/## Bug Details/p' "$REPORT_FILE" | head -20
    sed -n '/## Root Cause Summary/,/## Code Analysis/p' "$REPORT_FILE" | head -20

    LAST_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$REPORT_FILE" 2>/dev/null || \
                    date -r "$REPORT_FILE" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "Unknown")
    echo "📅 Last Investigation: $LAST_MODIFIED"

    # Show outstanding action items
    grep -A 10 "### Action Items" "$REPORT_FILE" | grep "^- \[ \]" || true

    echo ""
    echo "Continue from previous findings (A) or start fresh (B)?"
else
    echo "🆕 No previous investigation found for $BUG_ID"
    echo "📁 Will create new investigation at: $BUG_DIR"
fi
```

### 2. **Fetch Bug Details from JIRA**

```bash
jira issue view "$BUG_ID" --output json > /tmp/bug_details.json

SUMMARY=$(jq -r '.fields.summary' /tmp/bug_details.json)
DESCRIPTION=$(jq -r '.fields.description' /tmp/bug_details.json)
REPORTER=$(jq -r '.fields.reporter.displayName' /tmp/bug_details.json)
PRIORITY=$(jq -r '.fields.priority.name' /tmp/bug_details.json)
STATUS=$(jq -r '.fields.status.name' /tmp/bug_details.json)
COMPONENTS=$(jq -r '.fields.components[].name' /tmp/bug_details.json 2>/dev/null || echo "None")
LABELS=$(jq -r '.fields.labels[]' /tmp/bug_details.json 2>/dev/null || echo "None")

jira issue comment list "$BUG_ID" --output json > /tmp/bug_comments.json

echo "✅ Bug: $SUMMARY"
echo "   Priority: $PRIORITY | Status: $STATUS"
```

### 3. **Initial Problem Analysis**

- Parse bug description and symptoms
- Identify affected components/features
- Determine when the issue started occurring
- Check for reproduction steps in the ticket
- Review any error messages or logs mentioned
- Determine if it's a frontend, backend, or integration issue

### 3.5 **GATE: Define Fix Verification Criteria (FVC)** ⚠️ CRITICAL

**Do not proceed to deep investigation until FVC are defined.**

Poor verification = bug "fixed" but reopens in a week.

#### Reproduction Verification

```markdown
## Reproduction Confirmed

### Environment

- [ ] Browser/OS: [e.g., Chrome 120 on macOS]
- [ ] User role/permissions: [e.g., Admin user]
- [ ] Data state: [e.g., User with 3+ saved items]

### Steps to Reproduce

1. [Exact step 1]
2. [Exact step 2]
3. [Exact step 3]

### Expected Result

[What should happen]

### Actual Result

[What actually happens — include error messages]

### Reproduction Rate

- [ ] 100% reproducible
- [ ] Intermittent (X out of Y attempts)
- [ ] Environment-specific
```

#### Fix Verification Criteria (FVC)

```markdown
## Fix Verification Criteria

### Primary FVC (Must pass to close bug)

| ID    | Criterion                               | Test Type          | Verified |
| ----- | --------------------------------------- | ------------------ | -------- |
| FVC-1 | [Original bug scenario works correctly] | Manual + Automated | ⬜       |
| FVC-2 | [Edge case 1 works]                     | Automated          | ⬜       |
| FVC-3 | [Edge case 2 works]                     | Automated          | ⬜       |

### Regression FVC (Must not break)

| ID     | Criterion                     | Test Exists | Verified |
| ------ | ----------------------------- | ----------- | -------- |
| FVC-R1 | [Related feature still works] | ⬜          | ⬜       |
| FVC-R2 | [Similar workflow unaffected] | ⬜          | ⬜       |
```

#### Edge Case Discovery

| Scenario         | Could This Also Fail?                     | Add to FVC? |
| ---------------- | ----------------------------------------- | ----------- |
| Empty state      | What if user has no data?                 |             |
| Large data       | What if user has 1000+ items?             |             |
| Concurrent users | What if two users do this simultaneously? |             |
| Slow network     | What if request times out?                |             |
| Partial data     | What if some fields are null?             |             |

**⚠️ CHECKPOINT — Before proceeding:**

1. Bug is reproducible with documented steps
2. FVC are defined (at minimum: original scenario + 2 edge cases)
3. Regression areas identified
4. Test strategy is clear

### 4. **Repository Investigation**

#### Identify available repos

```bash
CURRENT_REPO=$(basename $(git rev-parse --show-toplevel 2>/dev/null) || echo "none")
echo "Current repository: $CURRENT_REPO"

# Check for sibling repos (adjust paths for your project structure)
# Common convention: repos sit side-by-side in the same parent directory
PARENT_DIR=$(dirname $(git rev-parse --show-toplevel 2>/dev/null))
echo "Sibling repos in $PARENT_DIR:"
ls "$PARENT_DIR" 2>/dev/null | head -10
```

#### Investigation approaches

**A. When working in a single repo:**

- Trace the bug within the current codebase
- Search for the failing condition: `git grep -n "relevant-pattern"`
- Check recent commits: `git log --oneline --since="2 weeks ago" --all`
- Review git blame on suspicious files

**B. When investigating across multiple repos:**

- Identify the request/response boundary
- Trace the API call from client to server
- Check error contracts between systems
- Review deployment timelines for both repos

**C. When source is unavailable:**

- Work from JIRA comments, stack traces, and logs
- Document assumptions clearly in the report

### 5. **5 Whys Analysis**

#### Why #1: Direct Cause

**Question:** Why did this bug occur?

- Find the specific code that failed
- Review error logs and stack traces
- Identify the failing condition or logic
- Check network requests/responses

#### Why #2: Process Failure

**Question:** Why did the code allow this to happen?

- Examine missing validation or error handling
- Check for missing guards or checks
- Review the code flow and logic paths

#### Why #3: Design/Architecture Issue

**Question:** Why was the system designed this way?

- Analyze architectural decisions
- Check for technical debt
- Examine coupling and dependencies

#### Why #4: Development Process Gap

**Question:** Why wasn't this caught during development?

- Review test coverage for the area
- Check code review practices
- Examine development guidelines

#### Why #5: Root Organizational Cause

**Question:** Why do our processes allow this?

- Identify systemic issues
- Review team practices and standards
- Examine documentation and knowledge sharing

### 6. **Evidence Collection**

For each "Why", collect:

```bash
# Code snippets showing the issue
grep -rn "failing-pattern" src/

# Recent commits in the affected area
git log --oneline -20 -- path/to/affected/file

# Test coverage check
# (varies by test framework — check package.json for the test command)
```

### 7. **Generate Report**

```bash
mkdir -p "$BUG_DIR"

# Back up previous investigation if continuing
if [[ -f "$REPORT_FILE" ]]; then
    BACKUP_DIR="${BUG_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp "$REPORT_FILE" "$BACKUP_DIR/investigation.md" 2>/dev/null || true
    cp "$TIMELINE_FILE" "$BACKUP_DIR/timeline.md" 2>/dev/null || true
    cp "$RECOMMENDATIONS_FILE" "$BACKUP_DIR/recommendations.md" 2>/dev/null || true
fi
```

Generate three files:

**`investigation.md`** — main report:

````markdown
# Bug Investigation: [BUG_ID]

**Bug:** [Summary]
**Date:** [Investigation Date]
**Severity:** [Priority]
**Status:** [Current Status]

---

## 🎯 FIX VERIFICATION CRITERIA

> **⚠️ Bug is NOT fixed until ALL FVC are verified.**

### Primary FVC

| ID    | Criterion                   | Test Added | Verified |
| ----- | --------------------------- | ---------- | -------- |
| FVC-1 | Original bug scenario works | ⬜         | ⬜       |
| FVC-2 | [Edge case 1]               | ⬜         | ⬜       |
| FVC-3 | [Edge case 2]               | ⬜         | ⬜       |

### Regression FVC

| ID     | Criterion         | Test Exists | Verified |
| ------ | ----------------- | ----------- | -------- |
| FVC-R1 | [Related feature] | ⬜          | ⬜       |

---

## Executive Summary

### The Problem

[Clear description of what went wrong]

### Root Cause

[One sentence summary]

### Impact

- **Users Affected:** [Estimate]
- **Features Impacted:** [List]

## 5 Whys Analysis

### Why #1: Direct Cause

**Answer:** [Technical explanation]
**Evidence:**

```code
// Failing code
```
````

- File: [path:line]
- Error: [message]

### Why #2: Process Failure

**Answer:** [Missing validation/checks]

### Why #3: Design Issue

**Answer:** [Architectural limitations]

### Why #4: Development Process Gap

**Answer:** [Process breakdown]

### Why #5: Root Organizational Cause

**Answer:** [Systemic issue]

## Root Cause Summary

- **Technical:** [Specific technical issue]
- **Process:** [Process or practice that failed]
- **Organizational:** [Systemic issue to address]

## Recommendations

### Immediate Fix (P0)

[Specific fix with code snippet]

### Short-term (P1)

1. Add tests: [test cases needed]
2. Improve validation: [where and what]

### Long-term Prevention (P2)

1. Architecture change: [proposed improvement]
2. Process update: [new practice]

## Action Items

- [ ] Implement immediate fix
- [ ] Write regression tests (must fail without fix, pass with fix)
- [ ] Update documentation
- [ ] Schedule architecture review if needed

````

**`timeline.md`** — chronological history of the bug from report to resolution.

**`recommendations.md`** — standalone doc with code-level improvement recommendations and process changes.

### 8. **Bug Fix PR Checklist**

Generate and share before merging the fix:

```markdown
# Bug Fix PR Checklist: [BUG_ID]

## 🎯 Fix Verification Criteria

| FVC ID | Criterion | Test Added | Manually Verified |
|--------|-----------|------------|-------------------|
| FVC-1 | [Original bug scenario] | ⬜ | ⬜ |
| FVC-2 | [Edge case 1] | ⬜ | ⬜ |
| FVC-3 | [Edge case 2] | ⬜ | ⬜ |

## Pre-Merge Checklist
- [ ] Fix addresses root cause (not just symptoms)
- [ ] Regression test added that would have caught this bug
- [ ] Test fails without fix, passes with fix
- [ ] Edge case tests added for FVC-2, FVC-3
- [ ] Related features still work (FVC-R1, FVC-R2)
- [ ] No new console errors
````

## Notes:

- `REPORT_BASE` defaults to `$HOME/Documents/technical-analysis`; override with env var
- Requires `jira` CLI authenticated via `jira init` when using a ticket ID
- When run without a ticket ID, enters manual description mode
- FVC-first: verification criteria are defined before deep investigation begins
- Every fix requires a regression test that would have caught the original bug
