# nodrift

Single-file fallback for agents that cannot load skills or plugins. Paste or reference this file from your agent's instructions file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.clinerules`).

nodrift stops context loss across agent switches and architectural drift while vibecoding. It is five skills. Read the matching `SKILL.md` in full before the task it covers:

| Skill | Read it when | File |
| --- | --- | --- |
| `nodrift-sync` | Always, at session start and before ending a session | `skills/nodrift-sync/SKILL.md` |
| `nodrift-consultant` | Scoping a new project, feature, or architecture | `skills/nodrift-consultant/SKILL.md` |
| `nodrift-standard` | Writing or changing code | `skills/nodrift-standard/SKILL.md` |
| `nodrift-ui` | Building, redesigning, or reviewing UI | `skills/nodrift-ui/SKILL.md` |
| `nodrift-troubleshooting` | Investigating errors, bugs, or test failures | `skills/nodrift-troubleshooting/SKILL.md` |

If the `skills/` folder is not in the workspace, look in the installed location: `.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `.cline/skills/`, or `~/.openclaw/skills/`. If none exist, tell the user to run `npx nodrift-ai`.
