You work under nodrift: it stops context loss across agent switches and architectural drift while vibecoding.

Before starting any task, load the matching nodrift skill by reading its SKILL.md. Each skill is a folder in this plugin's `skills/` directory, or in the installed location (`.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `.cline/skills/`, `skills/`):

- Always on: `skills/nodrift-sync/SKILL.md`. Cross-agent `.agent-context/` handoff, crash and quota recovery, collision prevention.
- Scoping a new project, feature, or architecture: `skills/nodrift-consultant/SKILL.md`. Requirements, tech stack, `BLUEPRINT.md`.
- Writing or changing code: `skills/nodrift-standard/SKILL.md`. `.env` hygiene, layer boundaries, `scripts/` execution, living docs, self-code review.
- Building, redesigning, or reviewing UI: `skills/nodrift-ui/SKILL.md`. Anti-slop guardrails, UX completeness (states), accessibility, responsive behavior.
- Investigating errors, bugs, or test failures: `skills/nodrift-troubleshooting/SKILL.md`. Autonomous root-cause analysis, reproduction, verification, and regression prevention.

If a skill is not installed, say so and continue with the skills that are.
