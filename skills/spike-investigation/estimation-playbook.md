# Estimation & Forecasting Playbook

This playbook outlines a structured approach to refining backlogs, planning sprints, executing daily tasks, and conducting retrospectives. Additionally, it introduces Monte Carlo simulations as a probabilistic forecasting method to replace traditional deadline-based estimations with confidence intervals.

## Backlog Refinement (Weekly or Biweekly)

- **Goal:** Ensure stories are small, clear, and sized consistently.
- **Actions:**
  - Review upcoming stories, ensuring most fit within 2–3 days of work.
  - Use relative sizing (story points, T-shirt sizes) with past examples as anchors.
  - Flag ambiguous or oversized stories and split them.
  - Add feature flags to ensure we can have a good release.
- **Outcome:** The backlog contains "ready" work items that the team understands.

## Sprint Planning (Every 2 Weeks)

- **Goal:** Commit to a realistic set of stories based on historical data.
- **Actions:**
  - Look at the last 3–5 sprint velocity average (e.g., ~34 points in your data).
  - Commit to slightly less than this average (~90–95%) to leave room for unplanned work.
  - Highlight dependencies and risks early.
- **Outcome:** A stable commitment that the team has confidence in delivering.

## Daily Execution

- **Goal:** Improve flow and reduce cycle time.
- **Actions:**
  - Keep WIP (work in progress) low — no one should have >1–2 tasks at once.
  - Monitor blockers daily; swarm on stalled items.
  - Encourage early test/merge, not "big bang" at the end.
- **Outcome:** More predictable delivery of stories within the sprint.

## Retrospective (End of Sprint)

- **Goal:** Learn from estimation misses and cycle time outliers.
- **Actions:**
  - Compare commitment vs. completion — were estimates inflated, deflated, or disrupted by unplanned work?
  - Investigate longest cycle-time issues — were they too big, blocked, or unclear?
  - Adjust estimation calibration with these insights.
- **Outcome:** Continuous improvement in sizing and planning.

## Monte Carlo Simulations for Forecasting

Monte Carlo simulations are a probabilistic forecasting method that use your historical throughput or cycle time data to predict future outcomes. Instead of saying, "We'll definitely finish this in 4 sprints," you can say, "There's an 85% chance we'll finish within 4–5 sprints."

### How It Works

1. **Input historical data:**
   - Use throughput (stories or points completed per sprint) or
   - Use cycle time (days issues take to complete).
   - Both of these are already in your Jira reports.
2. **Run thousands of simulations:**
   - For example, randomly sample from your past 20 sprints' velocities.
   - Repeat 10,000 times to see how often a given scope is finished.
3. **Get probabilistic outcomes:**
   - Instead of one forecast, you'll see ranges like:
     - 50% chance: Done in 3 sprints
     - 85% chance: Done in 4 sprints
     - 95% chance: Done in 5 sprints
4. **Communicate with stakeholders:**
   - This frames delivery as confidence intervals instead of promises.
   - Example: "We're 85% confident we can deliver Feature X by mid-November."

### How Your Team Could Apply It

- **For sprint-level planning:** Validate that your commitment fits within likely velocity.
- **For larger initiatives (epics):** Use Monte Carlo on cycle time to estimate when all stories will complete.
- **For capacity conversations:** Show leadership the probability of hitting certain dates, making tradeoffs clearer.

### Tools to Use

- **Jira add-ons:** "ActionableAgile," "Monte Carlo Sprint Planner," or "Forecast & Management Reports" can plug into Jira.
- **Custom spreadsheets or scripts:** Export Jira velocity/cycle data and run simulations in Excel, R, or Python.
- **Visualization:** Show histograms or cumulative probability charts to stakeholders.

## Putting It All Together

By consolidating techniques such as backlog refinement, sprint planning, daily execution, and retrospectives, along with advanced forecasting methods like Monte Carlo simulations, this section provides a clear blueprint for project success.

- Use the playbook (refinement → planning → execution → retrospective) to stabilize your estimation process.
- Layer on Monte Carlo simulations for forecasting beyond the sprint, shifting conversations from "exact dates" to "confidence-based delivery ranges."
- Over time, your velocity and cycle time will stabilize, making simulations more accurate and planning less stressful.
