---
name: feature-investigation
description: Investigate and plan implementation of a new feature using Acceptance Criteria as the central organizing principle. Fetches ticket details from JIRA, validates and clarifies AC before any planning begins, maps every implementation task back to a specific AC, and generates an implementation plan, technical design, task breakdown, and PR checklist template. Requires jira CLI.
---

# Feature Investigation - AC-Driven Implementation Planning

Investigate and plan the implementation of a new feature with **Acceptance Criteria as the central organizing principle**. Every task, test, and verification ties back to specific AC.

**Feature Request:** $ARGUMENTS (JIRA issue key or feature description)

## Philosophy: AC-First Development

**Why features fail:** Acceptance criteria get buried in documentation, forgotten during implementation, and only remembered during QA when it's expensive to fix.

**This skill ensures:**
1. AC are validated and clarified BEFORE any planning
2. Every task links to specific AC
3. Checkpoints verify AC progress throughout development
4. PR checklist explicitly maps to AC

## Investigation Process:

### 0. **Check for Previous Feature Planning**
```bash
REPORT_BASE="${REPORT_BASE:-$HOME/Documents/technical-analysis}"
FEATURE_ID="$ARGUMENTS"
FEATURE_DIR="${REPORT_BASE}/features/${FEATURE_ID}"
PLAN_FILE="${FEATURE_DIR}/implementation-plan.md"
DESIGN_FILE="${FEATURE_DIR}/technical-design.md"
TASKS_FILE="${FEATURE_DIR}/task-breakdown.md"

if [[ -f "$PLAN_FILE" ]]; then
    echo "🔍 Found previous planning for $FEATURE_ID"
    echo "📁 Location: $FEATURE_DIR"
    
    sed -n '/## Executive Summary/,/## Feature Details/p' "$PLAN_FILE" | head -20
    sed -n '/## Implementation Approach/,/## Technical Design/p' "$PLAN_FILE" | head -20
    
    LAST_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$PLAN_FILE" 2>/dev/null || \
                    date -r "$PLAN_FILE" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "Unknown")
    echo "📅 Last Planning Session: $LAST_MODIFIED"
    
    grep -A 20 "### Sprint Planning" "$PLAN_FILE" | grep "^- \[ \]" | head -5 || true
    
    echo ""
    echo "Continue refining existing plan (A) or start fresh (B)?"
else
    echo "🆕 No previous planning found for $FEATURE_ID"
    echo "📁 Will create new planning at: $FEATURE_DIR"
fi
```

### 1. **Fetch Feature Details from JIRA**
```bash
if [[ "$FEATURE_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    jira issue view "$FEATURE_ID" --output json > /tmp/feature_details.json

    SUMMARY=$(jq -r '.fields.summary' /tmp/feature_details.json)
    DESCRIPTION=$(jq -r '.fields.description' /tmp/feature_details.json)
    REPORTER=$(jq -r '.fields.reporter.displayName' /tmp/feature_details.json)
    PRIORITY=$(jq -r '.fields.priority.name' /tmp/feature_details.json)
    STATUS=$(jq -r '.fields.status.name' /tmp/feature_details.json)
    COMPONENTS=$(jq -r '.fields.components[].name' /tmp/feature_details.json 2>/dev/null || echo "None")
    ACCEPTANCE_CRITERIA=$(jq -r '.fields.customfield_10100' /tmp/feature_details.json 2>/dev/null || echo "To be defined")

    jira issue comment list "$FEATURE_ID" --output json > /tmp/feature_comments.json

    echo "✅ Feature: $SUMMARY"
    echo "   Priority: $PRIORITY | Status: $STATUS"
else
    echo "📝 Feature description provided directly (not a JIRA ticket)"
    SUMMARY="$FEATURE_ID"
fi
```

### 1.5 **GATE: Acceptance Criteria Validation** ⚠️ CRITICAL

**STOP HERE if AC are missing or unclear. Do not proceed to planning.**

```bash
echo "════════════════════════════════════════════"
echo "         ACCEPTANCE CRITERIA REVIEW         "
echo "════════════════════════════════════════════"

if [[ -n "$ACCEPTANCE_CRITERIA" ]] && [[ "$ACCEPTANCE_CRITERIA" != "null" ]] && \
   [[ "$ACCEPTANCE_CRITERIA" != "To be defined" ]]; then
    echo "📋 Acceptance Criteria from JIRA:"
    echo "$ACCEPTANCE_CRITERIA"
else
    echo "⚠️  NO ACCEPTANCE CRITERIA FOUND IN JIRA"
    echo "Before proceeding, AC must be defined. Ask the product owner or define them now."
fi
```

#### AC Quality Checklist

Evaluate each AC against these criteria:

| Quality Check | Pass? | Issue |
|---------------|-------|-------|
| **Specific** — Is it clear what "done" looks like? | | |
| **Measurable** — Can we write a test for it? | | |
| **Achievable** — Is it technically feasible? | | |
| **Relevant** — Does it tie to user value? | | |
| **Testable** — Can QA verify it? | | |

#### Missing AC to check for:
- [ ] Error handling — what happens when things fail?
- [ ] Loading states — what does the user see while waiting?
- [ ] Empty states — what if there's no data?
- [ ] Permissions — who can access this?
- [ ] Mobile/responsive — does it need to work on mobile?
- [ ] Accessibility — any a11y requirements?
- [ ] Performance — any speed requirements?
- [ ] Analytics — what events need tracking?

#### Refined AC format:
```markdown
## Refined Acceptance Criteria

### Functional Requirements
- **AC-1**: [Clear, testable criterion]
  - Test: [How to verify]
  - Edge cases: [What to watch for]

### Non-Functional Requirements
- **AC-NFR-1**: [Performance/security/accessibility criterion]
  - Threshold: [Specific number if applicable]

### Out of Scope (Explicitly)
- [Thing that might be assumed but isn't included]
```

**⚠️ CHECKPOINT — Confirm before proceeding:**
1. All AC are clear and testable
2. Missing AC have been identified and added
3. Clarifying questions answered (or noted for follow-up)

### 2. **Codebase Analysis**

```bash
# Understand the existing codebase relevant to this feature
echo "📁 Analyzing project structure..."

# Check for similar existing features as implementation templates
grep -rn "similar-pattern" src/ 2>/dev/null | head -20

# Identify key files likely touched by this feature
# (based on components/labels from the ticket)
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.py" | head -20

# Check recent related commits
git log --oneline --all --since="3 months ago" --grep="$FEATURE_ID" 2>/dev/null || true

# Look for related feature flags or config
grep -rn "featureFlag\|feature_flag\|FEATURE_" src/ 2>/dev/null | head -10
```

#### What to look for:
- **Similar features**: Use as implementation templates
- **Existing patterns**: API response formats, validation libraries, state management
- **Component libraries**: Design system components available to reuse
- **Reusable services**: Utilities that can be leveraged
- **API contracts**: Existing endpoint patterns to follow

### 3. **Cross-System Design Analysis**

#### Frontend Planning:
- **User Interface**: Component hierarchy and state management
- **User Experience**: Flow diagrams and interaction patterns
- **API Integration**: Required endpoints and data contracts
- **Performance**: Loading strategies and optimizations
- **Accessibility**: WCAG compliance requirements

#### Backend Planning:
- **API Design**: RESTful endpoints or GraphQL schema
- **Data Models**: Database schema and relationships
- **Business Logic**: Service layer architecture
- **Security**: Authentication and authorization
- **Performance**: Caching and query optimization

#### Integration Points:
- **API Contract**: Request/response specifications
- **Error Handling**: Failure scenarios and recovery
- **Data Validation**: Client and server-side rules
- **Testing Strategy**: Integration test approach
- **Deployment**: Feature flags and rollout plan

### 4. **Implementation Phases**

#### Phase 1: Foundation
- Core data models
- Basic API endpoints
- Minimal UI components
- Unit test structure

#### Phase 2: Core Features
- Complete business logic
- Full UI implementation
- Integration tests
- Error handling

#### Phase 3: Polish
- Performance optimization
- Enhanced UX features
- Comprehensive testing
- Documentation

#### Phase 4: Launch Preparation
- Feature flags setup
- Monitoring configuration
- Rollout planning
- Team training

### 5. **Generate Documentation**

```bash
mkdir -p "$FEATURE_DIR"

# Back up previous planning if continuing
if [[ -f "$PLAN_FILE" ]]; then
    BACKUP_DIR="${FEATURE_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp "$PLAN_FILE" "$BACKUP_DIR/implementation-plan.md" 2>/dev/null || true
    cp "$DESIGN_FILE" "$BACKUP_DIR/technical-design.md" 2>/dev/null || true
    cp "$TASKS_FILE" "$BACKUP_DIR/task-breakdown.md" 2>/dev/null || true
fi
```

**`implementation-plan.md`** — top-level plan:
```markdown
# Feature Implementation Plan: [FEATURE_ID]

**Feature:** [Summary]
**Date:** [Date]
**Target Release:** [Version/Sprint]

---
## 🎯 ACCEPTANCE CRITERIA

> **Every task, test, and PR must trace back here.**

### Functional Requirements
| ID | Criterion | Status | Verified By |
|----|-----------|--------|-------------|
| AC-1 | [Criterion] | ⬜ Not Started | |
| AC-2 | [Criterion] | ⬜ Not Started | |

### Non-Functional Requirements
| ID | Criterion | Threshold | Status |
|----|-----------|-----------|--------|
| AC-NFR-1 | [Performance] | [e.g., < 200ms] | ⬜ |

### Status Legend
- ⬜ Not Started → 🔨 In Progress → ✅ Implemented → ✔️ Verified

---
## Executive Summary
**Problem:** [What we're solving]
**Business Value:** [Revenue/efficiency gains]
**Scope:** In scope: [...] | Out of scope: [...]

## Implementation Phases
[Phase breakdown with checkbox tasks, each labeled with AC-X]

## Risk Analysis
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|

## Definition of Done
- [ ] All AC marked ✔️ Verified
- [ ] QA sign-off on each AC
- [ ] Performance thresholds met
- [ ] Documentation updated
```

**`technical-design.md`** — API specs, data models, sequence diagrams, security design.

**`task-breakdown.md`** — AC-to-task mapping:
```markdown
# Task Breakdown: [FEATURE_ID]

## 🎯 AC-to-Task Mapping

> Every task must link to at least one AC.

| AC ID | Criterion | Tasks | Test Tasks |
|-------|-----------|-------|------------|
| AC-1 | [Criterion] | FE-001, BE-001 | TEST-001 |
| AC-2 | [Criterion] | FE-002, BE-002 | TEST-002 |

### Frontend Tasks
| Task | Description | AC | Points |
|------|-------------|-----|--------|
| FE-001 | [Description] | AC-1 | 3 |

### Backend Tasks
| Task | Description | AC | Points |
|------|-------------|-----|--------|
| BE-001 | [Description] | AC-1 | 3 |

## AC Coverage Check
- [ ] Every AC has at least one implementation task
- [ ] Every AC has at least one test task
- [ ] No orphan tasks (tasks without AC linkage)
```

**PR Checklist Template** — generate this for each PR:
```markdown
# PR Checklist: [FEATURE_ID] - [PR Title]

## 🎯 Acceptance Criteria Verification

| AC ID | Criterion | Implemented | Test Added | Manually Verified |
|-------|-----------|-------------|------------|-------------------|
| AC-1 | [Criterion] | ⬜ | ⬜ | ⬜ |
| AC-2 | [Criterion] | ⬜ | ⬜ | ⬜ |

## Pre-Merge Checklist
- [ ] Code follows project conventions
- [ ] Unit tests cover happy path for each AC
- [ ] Unit tests cover error cases for each AC
- [ ] AC-NFR-1: [Performance] — Measured: [result]
- [ ] AC-NFR-2: [Accessibility] — Verified: [how]
```

## Development Checkpoints

### Before Starting Any Task
- Which AC does this task address?
- What does "done" look like for this AC?
- What test will prove this AC is met?

### Before Creating a PR
- [ ] I can identify which AC this PR addresses
- [ ] I have a test for each AC in this PR
- [ ] I have manually verified each AC works
- [ ] AC status updated in `implementation-plan.md`

### Before Feature Release
- [ ] ALL AC marked ✔️ Verified
- [ ] QA has signed off on each AC
- [ ] No outstanding clarification questions
- [ ] Performance thresholds met

## Notes:
- `REPORT_BASE` defaults to `$HOME/Documents/technical-analysis`; override with env var
- Requires `jira` CLI authenticated via `jira init`
- Accepts either a JIRA ticket ID or a plain text feature description
- The AC gate (Step 1.5) is non-negotiable — vague AC = wasted development time
