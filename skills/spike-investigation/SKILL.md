---
name: spike-investigation
description: Investigate a technical spike by gathering requirements interactively, analyzing the codebase with grep and read tools, researching libraries and technologies, evaluating options, and producing a structured report using the standard spike template (Problem Statement, Context, Proposal with Options, Test Plan, Risk & Mitigation, Resources). Optionally integrates with JIRA if a ticket ID is referenced.
---

# Spike Investigation - Technical Research & Analysis

Investigate a technical spike by gathering requirements, analyzing the codebase, researching libraries, and creating a comprehensive recommendation report.

**Spike Topic:** $ARGUMENTS (e.g., "React 19 migration feasibility" or "GraphQL implementation options" or "PRO-1234")

## Investigation Process:

### 0. **Check for Previous Spike Analysis**

```bash
REPORT_BASE="${REPORT_BASE:-$HOME/Documents/technical-analysis}"
SPIKE_TOPIC="$ARGUMENTS"
SPIKE_ID=$(echo "$SPIKE_TOPIC" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]' | \
           sed 's/--*/-/g' | sed 's/^-\|-$//g')
SPIKE_DIR="${REPORT_BASE}/spikes/${SPIKE_ID}"
REPORT_FILE="${SPIKE_DIR}/analysis.md"
RESEARCH_FILE="${SPIKE_DIR}/research.md"
RECOMMENDATIONS_FILE="${SPIKE_DIR}/recommendations.md"

if [[ -f "$REPORT_FILE" ]]; then
    echo "🔍 Found previous spike analysis for: $SPIKE_TOPIC"
    echo "📁 Location: $SPIKE_DIR"

    sed -n '/## Problem Statement/,/## Context/p' "$REPORT_FILE" | head -20
    sed -n '/## Proposal/,/## Test Plan/p' "$REPORT_FILE" | head -30

    LAST_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$REPORT_FILE" 2>/dev/null || \
                    date -r "$REPORT_FILE" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "Unknown")
    echo "📅 Last Analysis: $LAST_MODIFIED"

    grep -A 10 "### Action Items" "$REPORT_FILE" | grep "^- \[ \]" | head -5 || true

    echo ""
    echo "Continue from previous findings (A) or start fresh (B)?"
else
    echo "🆕 No previous analysis found for: $SPIKE_TOPIC"
    echo "📁 Will create at: $SPIKE_DIR"
fi
```

### 1. **Gather Spike Requirements & Context**

```bash
mkdir -p "$SPIKE_DIR"

# If spike topic contains a JIRA key, fetch ticket context
if echo "$SPIKE_TOPIC" | grep -qE "[A-Z]{2,}-[0-9]+"; then
    JIRA_KEY=$(echo "$SPIKE_TOPIC" | grep -oE "[A-Z]{2,}-[0-9]+" | head -1)
    echo "🎫 Found JIRA reference: $JIRA_KEY"

    if command -v jira >/dev/null 2>&1; then
        jira issue view "$JIRA_KEY" 2>/dev/null && JIRA_CONTEXT_FOUND=true || JIRA_CONTEXT_FOUND=false
    else
        echo "⚠️  jira CLI not available — continuing without ticket context"
    fi
fi
```

**Then prompt the user for:**

**📋 Business Context:**

1. What business problem are we trying to solve?
2. What are the success criteria for this spike?
3. What's the expected timeline/deadline?
4. What's the impact if we don't implement this?

**🔧 Technical Scope:**

1. Which parts of the system are in scope?
2. Are there specific technologies to evaluate?
3. What are the current pain points being addressed?
4. Are there any constraints or limitations?

**🔬 Research Areas:**

1. What specific questions need answering?
2. What alternatives should be compared?
3. Are there libraries/frameworks to investigate?
4. Is a proof-of-concept needed?

### 2. **Codebase Analysis**

Use grep, find, and read tools to understand the current system:

```bash
echo "📁 Analyzing current project structure..."

# Project overview
find . -name "package.json" -not -path "*/node_modules/*" | head -5
cat package.json 2>/dev/null | jq '{name, version, dependencies, devDependencies}' 2>/dev/null || \
    grep -A 5 '"dependencies"' package.json | head -20

# Identify relevant architecture patterns
echo "🔍 Scanning for relevant patterns..."

# Technology-specific searches (adapt to spike topic)
# Examples:
grep -rn "import.*from" src/ --include="*.ts" 2>/dev/null | \
    sed "s/.*from '//;s/'.*//" | sort | uniq -c | sort -rn | head -20

# Find files most likely affected by the spike
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.py" 2>/dev/null | \
    xargs grep -l "spike-relevant-keyword" 2>/dev/null | head -20

# Check existing patterns that might be replaced or extended
grep -rn "relevant-pattern" src/ 2>/dev/null | head -10

# Review recent changes for context
git log --oneline --since="3 months ago" --all | head -20
```

**Document findings:**

- Current technology stack and versions
- Architecture patterns in use
- Files and components that would be impacted
- Existing dependencies relevant to the spike
- Technical debt or pain points in the affected area
- Test coverage in the area of impact

### 3. **Technology Research**

For each library or technology being evaluated:

```bash
# Check current version in the project
grep '"library-name"' package.json package-lock.json 2>/dev/null

# Check for breaking changes between versions
# (Read the CHANGELOG or migration guides)
cat node_modules/library-name/CHANGELOG.md 2>/dev/null | head -100

# Identify current usage patterns
grep -rn "import.*library-name" src/ --include="*.ts" 2>/dev/null | head -20
grep -rn "from 'library-name'" src/ --include="*.ts" 2>/dev/null | head -20
```

Research each option using available knowledge and official documentation. For each technology, assess:

- **Maturity & stability** — production-ready? breaking changes?
- **Community & support** — actively maintained? known issues?
- **Performance characteristics** — benchmarks, known bottlenecks
- **Migration path** — complexity of moving from current state
- **Developer experience** — setup complexity, tooling, debugging
- **Security** — known vulnerabilities, audit status
- **Bundle size / footprint** — if relevant to the spike

### 4. **Comparison Framework**

Build a weighted scoring matrix based on what matters for this specific spike:

```markdown
### Technology Comparison Matrix

| Criteria                     | Option A | Option B | Option C | Weight |
| ---------------------------- | -------- | -------- | -------- | ------ |
| Performance                  | /10      | /10      | /10      | %      |
| Developer Experience         | /10      | /10      | /10      | %      |
| Migration Cost               | /10      | /10      | /10      | %      |
| Community/Support            | /10      | /10      | /10      | %      |
| Long-term Viability          | /10      | /10      | /10      | %      |
| [Criteria specific to spike] | /10      | /10      | /10      | %      |
| **Weighted Score**           |          |          |          | 100%   |
```

Weights should reflect the actual business priorities stated in Step 1.

### 5. **Proof of Concept** (if applicable)

If the spike requires validation through code:

```bash
# Create a minimal POC in an isolated directory
mkdir -p "$SPIKE_DIR/poc"

# Document what was built, how long it took, and what was learned
# Key questions to answer with a POC:
# - Does this approach actually work in our environment?
# - How complex is the integration?
# - What unexpected issues arose?
# - What's the developer experience like day-to-day?
```

Record:

- Scope of what was built
- Time taken vs estimate
- Performance measurements (before/after)
- Developer experience notes
- Unexpected blockers or discoveries

### 6. **Generate Comprehensive Report**

```bash
mkdir -p "$SPIKE_DIR"

# Back up previous analysis if continuing
if [[ -f "$REPORT_FILE" ]]; then
    BACKUP_DIR="${SPIKE_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp "$REPORT_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$RESEARCH_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$RECOMMENDATIONS_FILE" "$BACKUP_DIR/" 2>/dev/null || true
fi
```

**`analysis.md`** — main report using the standard spike template:

```markdown
# Spike: [SPIKE_TOPIC]

**Date:** [Investigation Date]
**Status:** [Complete / In Progress]
**Author:** [Name]

---

## Problem Statement

[A clear, concise description of the problem being investigated. What is broken, missing, or needs to change? Why does it matter? 2–4 sentences max.]

---

## Context

[Background information needed to understand the problem. Include:

- Current state of the system / technology involved
- How we got here (relevant history or decisions)
- JIRA ticket reference if applicable: [JIRA-KEY] — [Title]
- Codebase impact: files, modules, or services affected
- Relevant constraints (timeline, team capacity, existing dependencies)]

---

## Proposal

[Brief framing of the options being evaluated and the recommendation. One short paragraph before diving into the options.]

### Option 1: [Name]

**Pros**

- [Advantage 1]
- [Advantage 2]
- [Advantage 3]

**Cons**

- [Disadvantage 1]
- [Disadvantage 2]

**Timeline**

[Estimated level of effort and delivery timeline for this option. Reference the Estimation & Forecasting Playbook for LoE guidance.]

---

### Option 2: [Name]

**Pros**

- [Advantage 1]
- [Advantage 2]

**Cons**

- [Disadvantage 1]
- [Disadvantage 2]

**Timeline**

[Estimated level of effort and delivery timeline for this option.]

---

> ℹ️ For how to estimate LoE and timelines see the **Estimation & Forecasting Playbook**

---

## Test Plan

[How will we verify this solution works? Include:

- Unit / integration / e2e test strategy
- Performance benchmarks (before/after if applicable)
- Manual verification steps or acceptance criteria
- Definition of done for the spike / follow-on implementation]

---

## Risk & Mitigation

| Risk     | Probability      | Impact           | Mitigation          |
| -------- | ---------------- | ---------------- | ------------------- |
| [Risk 1] | Low / Med / High | Low / Med / High | [How we address it] |
| [Risk 2] | Low / Med / High | Low / Med / High | [How we address it] |

---

## Resources

- [Link to JIRA ticket, design doc, RFC, ADR, or other reference]
- [Library / framework documentation]
- [Relevant internal runbooks or playbooks]
- [Prior art or related spikes]
```

**`research.md`** — detailed notes for each technology investigated, including code examples, version history, community signals, and integration discoveries.

**`recommendations.md`** — standalone implementation guidance: architecture changes, development workflow updates, code examples before/after, process improvements, monitoring/alerting setup.

## Notes:

- `REPORT_BASE` defaults to `$HOME/Documents/technical-analysis`; override with env var
- JIRA CLI (`jira`) is optional — only needed if a ticket ID is referenced in the spike topic
- The comparison matrix weights should reflect actual business priorities, not defaults
- POC is encouraged but optional — use judgment based on uncertainty and risk
- Supports continuation from previous analyses with automatic backup
