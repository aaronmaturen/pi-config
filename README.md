# pi-config

Professional development workflow skills for [pi](https://shittycodingagent.ai) — JIRA-linked commit messages, PR review, investigation workflows, and more.

## Skills

| Skill | Description |
|---|---|
| `commit-msg` | Generate a JIRA-linked commit message from staged changes |
| `pr-review` | Comprehensive PR analysis with educational context |
| `implement-pr-feedback` | Systematically work through PR review comments |
| `ticket-explainer` | Explain a JIRA ticket in plain language |
| `bug-investigation` | 5 Whys root cause analysis with Fix Verification Criteria |
| `feature-investigation` | Feature requirement analysis from a JIRA ticket |
| `spike-investigation` | Technical spike research and recommendation report |
| `generate-slidedeck` | Generate a presentation deck from a topic or document |

## Installation

```bash
pi install git:github.com/aaronmaturen/pi-config
```

## Usage

```bash
/skill:commit-msg
/skill:pr-review https://github.com/org/repo/pull/123
/skill:implement-pr-feedback
/skill:ticket-explainer PRO-1234
/skill:bug-investigation BUG-567
/skill:feature-investigation PRO-1234
/skill:spike-investigation
/skill:generate-slidedeck
```

## Dependencies

Some skills require external CLIs:

```bash
# GitHub CLI — for pr-review, implement-pr-feedback
brew install gh && gh auth login

# JIRA CLI — for ticket-explainer, bug/feature-investigation
brew install ankitpokhrel/jira-cli/jira-cli && jira init
```

## License

MIT
