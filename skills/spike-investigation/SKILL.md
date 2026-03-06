---
name: spike-investigation
description: Investigate a technical spike by gathering requirements interactively, analyzing the codebase with grep and read tools, researching libraries and technologies, evaluating options, and producing a structured report with a high-level proposals doc (for managers/PMs/designers) and detailed technical analysis. Uses Monte Carlo simulation for timeline forecasting with confidence levels. Optionally integrates with JIRA if a ticket ID is referenced.
---

# Spike Investigation - Technical Research & Analysis

Investigate a technical spike by gathering requirements, analyzing the codebase, researching libraries, and creating a comprehensive recommendation report with a stakeholder-facing proposals document.

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
PROPOSALS_FILE="${SPIKE_DIR}/proposals.md"
MONTE_CARLO_FILE="${SPIKE_DIR}/monte-carlo.js"

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
mkdir -p "$SPIKE_DIR/poc"
```

Record:

- Scope of what was built
- Time taken vs estimate
- Performance measurements (before/after)
- Developer experience notes
- Unexpected blockers or discoveries

### 6. **Review Estimation Playbook**

Before generating timeline estimates, read the Estimation & Forecasting Playbook for the team's estimation conventions:

```bash
SKILL_DIR="$(dirname "$0")"
cat "${SKILL_DIR}/estimation-playbook.md"
```

Key principles to apply:

- Frame delivery as **confidence intervals**, not single dates or vague ranges
- Use **P85 as the recommended planning target** ("We're 85% confident we can deliver by [date]")
- Stories should fit within **2–3 days of work** — if a phase has stories larger than that, split them
- If historical **throughput data** (velocity per sprint) is available, use it to calibrate estimates
- The Monte Carlo simulation is the primary forecasting tool — generate `monte-carlo.js` with every proposal

### 7. **Generate Reports**

```bash
mkdir -p "$SPIKE_DIR"

# Back up previous analysis if continuing
if [[ -f "$REPORT_FILE" ]]; then
    BACKUP_DIR="${SPIKE_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp "$REPORT_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$RESEARCH_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$RECOMMENDATIONS_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$PROPOSALS_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$MONTE_CARLO_FILE" "$BACKUP_DIR/" 2>/dev/null || true
fi
```

Generate the following deliverables. The **proposals doc** is the primary stakeholder-facing output. The analysis, research, and recommendations files provide the deep technical backing.

---

#### 7a. **`proposals.md`** — High-Level Proposal (for managers, PMs, designers)

This is the document stakeholders read. It should be written in plain language, explain the "why" before the "what," and present options with clear tradeoffs. Use the following template structure:

```markdown
# [Proposal Title — Plain Language]

**Date:** [Date]
**Status:** Ready for Decision
**Audience:** Product, Design, Engineering Leadership

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Context](#context)
3. [Proposal](#proposal)
4. [Risk & Mitigation](#risk--mitigation)
5. [Test Plan](#test-plan)
6. [Resources](#resources)

---

## Problem Statement

[2–4 sentences max. What is the problem? Why does it matter to the business? What happens if we don't act?

Write for someone who doesn't know the codebase. No jargon without explanation.]

---

## Context

[Background that stakeholders need to understand the proposal. Include:

- Current state of things (what exists today)
- How we got here (decisions, history, accumulated debt)
- Key numbers that quantify the problem (counts, percentages, impact metrics)
- What's already working well (acknowledge strengths)
- Bugs or issues discovered during investigation

Use tables for structured data. Explain technical concepts in plain language with analogies where helpful.]

---

## Proposal

[One short paragraph framing the options and the recommendation.]

### Option 1: [Name — plain language description]

**The Idea**

[1 paragraph explaining the approach in non-technical terms.]

**Phases at a Glance**

| Phase | Name | What Happens | Duration | Who |
| ----- | ---- | ------------ | -------- | --- |
| ...   | ...  | ...          | ...      | ... |

**Pros**

- [Advantage 1 — frame in terms of business/team value]
- [Advantage 2]
- [Advantage 3]

**Cons**

- [Disadvantage 1 — be honest about costs and tradeoffs]
- [Disadvantage 2]

**Timeline**

> Estimated via Monte Carlo simulation (10,000 iterations, PERT distributions).
> See [Estimation Methodology](#appendix-estimation-methodology) for details.

| Confidence | Weeks | Interpretation                      |
| ---------- | ----- | ----------------------------------- |
| P50        | ~X    | Even odds we finish by this date    |
| P75        | ~X    | Reasonably confident                |
| P85        | ~X    | High confidence — plan to this      |
| P95        | ~X    | Near certain (buffer for surprises) |

---

### Option 2: [Name — plain language description]

[Same structure as Option 1]

---

### Side-by-Side Comparison

| Dimension                        | Option 1      | Option 2      |
| -------------------------------- | ------------- | ------------- |
| **Time to delivery (P50 / P85)** | ~X / ~Y weeks | ~X / ~Y weeks |
| [Key differentiator 1]           | ...           | ...           |
| [Key differentiator 2]           | ...           | ...           |
| **Cost of doing this again**     | ...           | ...           |

---

### Our Recommendation

**[Option N]**, because:

1. [Reason 1 — strongest argument]
2. [Reason 2]
3. [Reason 3]

---

### Decisions Needed

1. **Which option?**
2. **If Option 1:** [Key questions that must be answered]
3. **If Option 2:** [Key questions that must be answered]
4. **Either way:** [Shared questions]

---

## Risk & Mitigation

### Risks Shared by All Options

| Risk | Probability  | Impact       | Mitigation |
| ---- | ------------ | ------------ | ---------- |
| ...  | Low/Med/High | Low/Med/High | ...        |

### Risks Unique to Option 1

| Risk | Probability | Impact | Mitigation |
| ---- | ----------- | ------ | ---------- |
| ...  | ...         | ...    | ...        |

### Risks Unique to Option 2

| Risk | Probability | Impact | Mitigation |
| ---- | ----------- | ------ | ---------- |
| ...  | ...         | ...    | ...        |

---

## Test Plan

[How will we verify the solution works?

- Automated testing strategy (unit, integration, e2e)
- Visual or manual verification approach
- Performance benchmarks (before/after if applicable)
- Definition of done / acceptance criteria
- Rollback plan if things go wrong]

---

## Resources

- [JIRA ticket link if applicable]
- [Design documents or Figma links]
- [Related spikes or prior art]
- [Library/framework documentation]
- [Internal runbooks or playbooks]

---

## Appendix: [Topic]-Specific Detail

[Appendices for deep-dive detail that supports the main proposal but would overwhelm the core narrative. Examples:

- Current state detail (architecture, file inventory, dependency maps)
- Per-option phase detail (gate criteria, task breakdowns, dependencies)
- Measuring progress (metrics table with starting values and targets)]

---

## Appendix: Estimation Methodology

> For the full estimation framework, see the **Estimation & Forecasting Playbook**.

### Monte Carlo Simulation

Timeline estimates in this document use **Monte Carlo simulation** — a probabilistic forecasting method that replaces traditional deadline-based estimates with confidence intervals. Instead of saying "We'll finish in 12 weeks," we say "We're 85% confident we'll finish within 15 weeks."

This approach aligns with how we plan sprints: we use historical velocity averages and commit to ~90–95% of capacity. Monte Carlo extends this thinking beyond the sprint to larger initiatives.

### How It Works

1. **Input estimates per phase** — each phase gets three estimates:

| Estimate            | Meaning                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| **Optimistic (O)**  | Everything goes well — no blockers, no surprises                           |
| **Most Likely (M)** | Realistic expectation based on the known scope                             |
| **Pessimistic (P)** | Things go wrong — integration issues, review cycles, unexpected edge cases |

2. **Run 10,000 simulations** — each simulation randomly samples from a PERT distribution (weighted toward Most Likely) for every phase, then sums the durations.

3. **Get probabilistic outcomes** — the 10,000 runs produce a probability distribution for the total project duration.

### Reading the Confidence Intervals

| Level   | Meaning                              | Use For                                                                             |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| **P50** | 50% chance of finishing by this date | Optimistic planning                                                                 |
| **P75** | 75% chance                           | Reasonable expectation                                                              |
| **P85** | 85% chance                           | **Recommended planning target** — "We're 85% confident we can deliver by this date" |
| **P95** | 95% chance                           | Conservative — accounts for multiple things going wrong                             |

When communicating with stakeholders, frame delivery as confidence intervals: "We're 85% confident we can deliver this by [date]." This is more honest and useful than a single date or a vague range.

### Input Estimates

[Table of O/M/P estimates per phase for each option. Example:]

**Option 1:**

| Phase            | Optimistic | Most Likely | Pessimistic |
| ---------------- | ---------- | ----------- | ----------- |
| Phase 1 — [Name] | X wks      | Y wks       | Z wks       |
| Phase 2 — [Name] | X wks      | Y wks       | Z wks       |

**Option 2:**

| Phase            | Optimistic | Most Likely | Pessimistic |
| ---------------- | ---------- | ----------- | ----------- |
| Phase 1 — [Name] | X wks      | Y wks       | Z wks       |
| Phase 2 — [Name] | X wks      | Y wks       | Z wks       |

### Calibration

These estimates should be recalibrated as work begins. Per the Estimation & Forecasting Playbook:

- **After the first phase completes:** compare actual vs estimate at retrospective. Were estimates inflated, deflated, or disrupted by unplanned work? Adjust subsequent phases.
- **With historical velocity data:** if the team tracks throughput (stories or points completed per sprint), use that data directly — randomly sample from past sprint velocities instead of using phase-level PERT estimates. This gets more accurate over time.
- **Each sprint:** update remaining phase estimates based on what's been learned. Re-run simulation. Over time, velocity and cycle time stabilize, making simulations more accurate and planning less stressful.

### Simulation Code

The simulation is reproducible: `monte-carlo.js` in this directory. Run with `node monte-carlo.js`.
```

**Writing guidelines for the proposals doc:**

- **Audience is non-technical stakeholders.** Explain technical concepts in plain language. Use analogies.
- **Lead with "why" before "what."** Problem Statement and Context come before any solution.
- **Be honest about tradeoffs.** Every option has real cons. Don't soft-pedal them.
- **Quantify everything possible.** Numbers (counts, percentages, weeks) are more persuasive than adjectives.
- **Use the comparison table.** Stakeholders skim — the side-by-side table is often the first thing they read.
- **Timelines use confidence levels, not ranges.** Instead of "8–12 weeks," say "P50: ~10 weeks, P85: ~11 weeks."
- **Keep the core narrative short.** Deep technical detail goes in appendices, not the main body.
- **Include "Decisions Needed."** End with clear, actionable questions for the decision-makers.

---

#### 7b. **`monte-carlo.js`** — Reproducible Timeline Simulation

Generate a Node.js script alongside the proposals doc that runs the Monte Carlo simulation. The script must:

1. Define phase-level 3-point estimates (Optimistic / Most Likely / Pessimistic in weeks) for each option
2. Use PERT distributions (weighted toward Most Likely) for sampling
3. Handle parallel phases (effective duration = max of parallel phases)
4. Handle external blockers (design reviews, etc.) that run alongside engineering work
5. Handle rollout/bake time (calendar time added after engineering work)
6. Run 10,000 iterations
7. Output confidence levels (P50, P75, P85, P95) per phase and total, for each option
8. Output a side-by-side comparison table

Use this simulation engine template:

```javascript
#!/usr/bin/env node

/**
 * Monte Carlo Simulation — [SPIKE TOPIC]
 *
 * Uses PERT distributions at the phase level.
 * Each phase has: optimistic (O), most likely (M), pessimistic (P) in weeks.
 * Phases are sequential unless marked parallel.
 *
 * Run: node monte-carlo.js
 */

const SIMULATIONS = 10_000;

// --- PERT Distribution Sampling ---

function pertRandom(o, m, p) {
	const mean = (o + 4 * m + p) / 6;
	const stdev = (p - o) / 6;
	if (stdev === 0) return mean;

	const alpha1 = ((mean - o) / (p - o)) * (((mean - o) * (p - mean)) / (stdev * stdev) - 1);
	const alpha2 = (alpha1 * (p - mean)) / (mean - o);

	const sample = sampleBeta(Math.max(alpha1, 0.5), Math.max(alpha2, 0.5));
	return o + sample * (p - o);
}

function sampleBeta(a, b) {
	const ga = sampleGamma(a);
	const gb = sampleGamma(b);
	return ga / (ga + gb);
}

function sampleGamma(shape) {
	if (shape < 1) return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
	const d = shape - 1 / 3;
	const c = 1 / Math.sqrt(9 * d);
	while (true) {
		let x, v;
		do {
			x = randn();
			v = 1 + c * x;
		} while (v <= 0);
		v = v * v * v;
		const u = Math.random();
		if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
		if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
	}
}

function randn() {
	const u1 = Math.random();
	const u2 = Math.random();
	return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Phase Definitions ---
// Populate with actual phase estimates from the investigation.
// O = optimistic, M = most likely, P = pessimistic (all in weeks).
//
// For parallel phases: model as a single entry using the longer phase's estimates.
// For phases with external blockers (e.g., design review): use max(eng work, blocker).
// For rollout/bake time: add as a separate phase with its own O/M/P.

const OPTION_1 = {
	name: "Option 1: [Name]",
	phases: [
		{ name: "Phase 1 — [Name]", o: 0, m: 0, p: 0 },
		// ... add phases
	],
};

const OPTION_2 = {
	name: "Option 2: [Name]",
	phases: [
		{ name: "Phase 1 — [Name]", o: 0, m: 0, p: 0 },
		// ... add phases
	],
};

// --- Simulation Engine ---

function simulate(proposal) {
	const results = [];
	for (let i = 0; i < SIMULATIONS; i++) {
		let total = 0;
		const phaseResults = {};
		for (const phase of proposal.phases) {
			const weeks = pertRandom(phase.o, phase.m, phase.p);
			phaseResults[phase.name] = weeks;
			total += weeks;
		}
		results.push({ total, phases: phaseResults });
	}
	return results;
}

function percentile(arr, p) {
	const sorted = [...arr].sort((a, b) => a - b);
	const idx = Math.ceil(sorted.length * (p / 100)) - 1;
	return sorted[Math.max(0, idx)];
}

function round1(n) {
	return Math.round(n * 10) / 10;
}

function formatResults(proposal, results) {
	const totals = results.map((r) => r.total);

	console.log(`\n${"═".repeat(72)}`);
	console.log(`  ${proposal.name}`);
	console.log(`${"═".repeat(72)}`);

	console.log(`\n  Timeline Forecast (${SIMULATIONS.toLocaleString()} simulations):`);
	console.log(`  ┌──────────────┬─────────────┬────────────────────────────────────────┐`);
	console.log(`  │  Confidence  │    Weeks    │  Interpretation                        │`);
	console.log(`  ├──────────────┼─────────────┼────────────────────────────────────────┤`);
	const levels = [
		[50, "Even odds we finish by this date"],
		[75, "Reasonably confident"],
		[85, "High confidence — plan to this"],
		[95, "Near certain (buffer for surprises)"],
	];
	for (const [p, desc] of levels) {
		const w = round1(percentile(totals, p));
		console.log(
			`  │     P${String(p).padEnd(7)}│  ${String(w).padStart(5)} wks  │  ${desc.padEnd(38)}│`,
		);
	}
	console.log(`  └──────────────┴─────────────┴────────────────────────────────────────┘`);

	console.log(`\n  Per-Phase Breakdown:`);
	console.log(`  ${"─".repeat(68)}`);
	console.log(`  ${"Phase".padEnd(52)} P50    P85    P95`);
	console.log(`  ${"─".repeat(68)}`);

	for (const phase of proposal.phases) {
		const phaseWeeks = results.map((r) => r.phases[phase.name]);
		const p50 = round1(percentile(phaseWeeks, 50));
		const p85 = round1(percentile(phaseWeeks, 85));
		const p95 = round1(percentile(phaseWeeks, 95));
		const shortName = phase.name.length > 50 ? phase.name.substring(0, 47) + "..." : phase.name;
		console.log(
			`  ${shortName.padEnd(52)} ${String(p50).padStart(4)}   ${String(p85).padStart(4)}   ${String(p95).padStart(4)}`,
		);
	}

	const mean = round1(totals.reduce((a, b) => a + b) / totals.length);
	console.log(`  ${"─".repeat(68)}`);
	console.log(
		`  ${"TOTAL".padEnd(52)} ${String(round1(percentile(totals, 50))).padStart(4)}   ${String(round1(percentile(totals, 85))).padStart(4)}   ${String(round1(percentile(totals, 95))).padStart(4)}`,
	);
	console.log(
		`\n  Mean: ${mean} wks  │  Min: ${round1(Math.min(...totals))} wks  │  Max: ${round1(Math.max(...totals))} wks`,
	);

	return totals;
}

// --- Run ---

console.log("\n🎲  Monte Carlo Simulation — [SPIKE TOPIC]");
console.log(
	`    ${SIMULATIONS.toLocaleString()} iterations  •  PERT distributions  •  Phase-level estimates\n`,
);

const totals1 = formatResults(OPTION_1, simulate(OPTION_1));
const totals2 = formatResults(OPTION_2, simulate(OPTION_2));

// Side-by-side
console.log(`\n${"═".repeat(72)}`);
console.log("  Side-by-Side");
console.log(`${"═".repeat(72)}`);
console.log(`\n  ┌──────────────┬──────────────────┬──────────────────┬──────────────┐`);
console.log(`  │  Confidence  │   Option 1       │   Option 2       │   Delta      │`);
console.log(`  ├──────────────┼──────────────────┼──────────────────┼──────────────┤`);
for (const p of [50, 75, 85, 95]) {
	const a = round1(percentile(totals1, p));
	const b = round1(percentile(totals2, p));
	const d = round1(a - b);
	const sign = d >= 0 ? "+" : "";
	console.log(
		`  │     P${String(p).padEnd(7)}│   ${String(a).padStart(5)} weeks    │   ${String(b).padStart(5)} weeks    │  ${sign}${String(d).padStart(4)} wks   │`,
	);
}
console.log(`  └──────────────┴──────────────────┴──────────────────┴──────────────┘`);
console.log("\n");
```

**Key principles for the Monte Carlo estimates:**

- **Derive O/M/P from the investigation.** Optimistic = everything goes right. Most Likely = realistic based on scope. Pessimistic = multiple things go wrong (but not catastrophe).
- **Phases are sequential unless explicitly parallel.** Sum the durations.
- **External blockers (design reviews, etc.) run in parallel with engineering** but may extend the phase if they take longer. Model as: effective phase duration = max(eng estimate, blocker estimate).
- **Rollout/bake time is calendar time, not engineering effort.** Model as a separate phase.
- **The simulation output drives the proposals doc timelines.** Run the script, copy the P50/P75/P85/P95 values into the proposals doc.

---

#### 7c. **`analysis.md`** — Detailed Technical Analysis

The deep-dive companion to the proposals doc. Contains the full codebase audit, quantified findings, and technical detail that backs up the proposals.

```markdown
# Spike: [SPIKE_TOPIC]

**Date:** [Investigation Date]
**Status:** [Complete / In Progress]
**Author:** [Name]

---

## Problem Statement

[Same as proposals.md — keep in sync]

---

## Context

[Detailed technical context — codebase structure, dependency analysis, file counts, architecture diagrams, code examples. This section is longer and more technical than the proposals.md version.]

---

## Findings

[Quantified codebase analysis results. Tables of counts, file inventories, pattern catalogs. Everything that supports the numbers in the proposals doc.]

---

## Options Analysis

[Technical deep-dive into each option — architecture changes, migration paths, code examples (before/after), dependency implications, performance analysis.]

---

## Recommendation

[Technical recommendation with detailed justification. May include implementation sequencing, architecture decision records, and technical prerequisites.]
```

#### 7d. **`research.md`** — Raw Research Notes

Detailed notes for each technology investigated — code examples, version history, community signals, integration discoveries, API comparisons.

#### 7e. **`recommendations.md`** — Implementation Guidance

Standalone implementation guidance: architecture changes, development workflow updates, code examples before/after, process improvements, monitoring/alerting setup.

## Output Summary

The spike investigation produces these deliverables in `$SPIKE_DIR`:

| File                 | Audience                 | Purpose                                                                                  |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `proposals.md`       | Managers, PMs, designers | High-level proposal with options, tradeoffs, Monte Carlo timelines, and decisions needed |
| `monte-carlo.js`     | Anyone (reproducible)    | Timeline simulation script — run `node monte-carlo.js` to regenerate forecasts           |
| `analysis.md`        | Engineering              | Deep technical analysis backing the proposals                                            |
| `research.md`        | Engineering              | Raw research notes per technology                                                        |
| `recommendations.md` | Engineering              | Implementation guidance and architecture decisions                                       |

## Notes:

- `REPORT_BASE` defaults to `$HOME/Documents/technical-analysis`; override with env var
- JIRA CLI (`jira`) is optional — only needed if a ticket ID is referenced in the spike topic
- The comparison matrix weights should reflect actual business priorities, not defaults
- POC is encouraged but optional — use judgment based on uncertainty and risk
- Supports continuation from previous analyses with automatic backup
- The proposals doc is the **primary deliverable** — it's what gets shared with stakeholders
- Monte Carlo estimates replace flat ranges (e.g., "8–12 weeks") with confidence levels (P50/P75/P85/P95)
- Always run `node monte-carlo.js` and copy the output into the proposals doc before finalizing
