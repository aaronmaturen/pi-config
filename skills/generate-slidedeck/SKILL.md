---
name: generate-slidedeck
description: Generate a Deckset-formatted markdown presentation about the current repository, the current git branch's changes, or a custom topic. Asks the user to choose scope, gathers information from the codebase or branch diff, and writes a .md file to ~/slidedecks/<project-name>/. No external tools required.
---

# Generate Deckset Markdown Slidedeck

Generate a markdown presentation in Deckset format for the entire repository, current branch, or a custom topic.

## Step 1: Determine Scope

Ask the user to select the scope for the slidedeck:

**Question**: "What would you like to create a slidedeck about?"
**Options**:

1. **Entire Repository** - Overview of the entire codebase, architecture, and key features
2. **Current Branch** - Focus on changes and features in the current git branch
3. **Custom Topic** - Specify a custom topic or focus area

## Step 2: Gather Information

Based on the selected scope:

### For "Entire Repository":

- Examine the repository structure
- Identify key components and architecture patterns
- Review README and documentation
- Identify main features and technologies used
- Check `package.json`, `go.mod`, `requirements.txt`, etc. for dependencies

### For "Current Branch":

```bash
# Get branch name
git rev-parse --abbrev-ref HEAD

# Get commit messages since main
git log main..HEAD --format='%s%n%b'

# See changed files
git diff main...HEAD --stat

# Understand the changes
git diff main...HEAD
```

### For "Custom Topic":

- Ask follow-up questions to understand the topic
- Search the codebase for relevant files and code
- Gather examples and key points related to the topic

## Step 3: Create Slidedeck Content

### Deckset Formatting Rules:

**Slide Structure:**

- Start with directives (`footer`, `slidenumbers`, `autoscale`) on first lines
- Use `---` with empty lines above and below to separate slides
- Headers: `#`, `##`, `###`, `####` for different sizes
- Lists: `1.` for ordered, `-` or `*` for unordered
- Emphasis: `**bold**`, `_italic_`, `**_both_**`
- Code: triple backticks with language name for syntax highlighting
- Quotes: `>` prefix, `--` for attribution
- Images: `![](path.jpg)`, `![right](path.jpg)`, `![fit](path.jpg)`
- Speaker notes: `^` prefix
- Line breaks: `<br/>`

**Example header directives:**

```
footer: © {Project Name} - {Current Year}
slidenumbers: true
autoscale: true
```

### Recommended Slide Order:

1. **Title slide** — project name and tagline
2. **Overview** — high-level summary (2–3 bullets)
3. **Architecture/Structure** — key components
4. **Key Features** — main capabilities (one per slide if many)
5. **Technical Stack** — technologies and tools used
6. **Code Examples** — relevant snippets with syntax highlighting
7. **Challenges & Solutions** — if applicable
8. **Future Work** — roadmap or next steps
9. **Conclusion** — summary and takeaways

## Step 4: Determine Output Path

```bash
# Get project name from current directory
PROJECT_NAME=$(basename $(pwd))

# Create output directory
mkdir -p ~/slidedecks/${PROJECT_NAME}

# Filename:
# - "presentation.md" for full repo scope
# - "{branch-name}.md" for branch scope
# - "{topic-slug}.md" for custom topic
```

## Step 5: Generate the Slidedeck

Create a well-structured presentation with:

- Professional, concise content
- Clear headers and sections
- Code examples with proper syntax highlighting
- Speaker notes where helpful (`^` prefix)
- Consistent formatting throughout
- Footer with project name and current year
- Slide numbers and autoscale enabled

**Minimal example:**

````markdown
footer: © My Project - 2025
slidenumbers: true
autoscale: true

# My Project

A one-line description of what this is.

^ Speaker note: introduce yourself before starting

---

## Overview

- What it does
- Who it's for
- Why it matters

---

## Architecture

[Key components and how they connect]

---

## Key Feature: [Name]

- Point 1
- Point 2

```typescript
// Relevant code example
const result = doTheThing();
```
````

^ Explain the interesting part here

---

## Thank You

**Repo:** github.com/org/project
**Docs:** docs.example.com

````

## Step 6: Save the File

```bash
mkdir -p ~/slidedecks/${PROJECT_NAME}
# Write slidedeck content to file
# Confirm full path to user
````

## Guidelines:

- Keep slides concise — one main idea per slide
- Use bullet points liberally
- Include relevant, well-formatted code examples
- Add speaker notes for complex slides (`^` prefix)
- Use emphasis (`**bold**`, `_italic_`) to highlight key points
- Break up dense information across multiple slides
- Use consistent header hierarchy (`#` for titles, `##` for section headers)
- Consider quotes for key insights or principles
- End with clear next steps or conclusions

## Output Message:

After saving, report:

1. Full path to the created file
2. Slide count
3. Brief summary of the content covered
4. Suggestion to open in Deckset

**Example:**

```
✅ Created: ~/slidedecks/my-project/presentation.md

📊 15 slides covering:
- Project overview and architecture
- 3 key features with code examples
- Tech stack and dependencies
- Roadmap and next steps

Open in Deckset to present!
```
