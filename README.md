# nodrift

Stop context loss and architectural drift across AI coding agents.

`nodrift` is a suite of five agent skills. It works in Antigravity, Codex, Claude Code, OpenClaw, OpenCode, Hermes, Cursor, Cline, and Gemini CLI.

## What it solves

**Multi-agent handoff.** You hit a quota in one agent and continue in another. The second agent has no idea what the first one decided, finished, or broke. Two agents edit the same file at once. A crash loses the session. `nodrift-sync` keeps a shared `.agent-context/` folder that any agent can read and resume from.

**Architectural drift.** Vibecoding without guardrails moves business logic into views, leaks secrets into commits, and leaves docs describing code that no longer exists. `nodrift-consultant` settles the architecture before code is written. `nodrift-standard` holds every later change to it.

**UI slop and incomplete UX.** Agents reach for generic gradients, filler copy, and fake metrics while omitting loading, empty, and responsive states. `nodrift-ui` enforces anti-slop guardrails, UX completeness, accessibility, and responsive behavior.

**Blind-retry debugging and symptom suppression.** Agents guess at fixes, comment out tests, silence types with `any`, or repeat hypotheses that already failed. `nodrift-troubleshooting` enforces evidence gathering before edits, clean reproduction, root-cause isolation, verification, and a hard stop rule against blind retries.

## The skills

| Skill | Role | Use it for |
| --- | --- | --- |
| `nodrift-sync` | Core, always on | `.agent-context/` state sync across agents, crash and quota recovery, concurrent file-collision prevention |
| `nodrift-consultant` | Before coding | Requirements analysis, tech stack selection, a `BLUEPRINT.md` |
| `nodrift-standard` | While coding | `.env` hygiene, MVC / MVVM / Clean Architecture layer boundaries, `scripts/` lifecycle automation, living documentation, self-code review |
| `nodrift-ui` | Frontend & UI | Anti-slop guardrails, UX completeness (states), accessibility, responsive behavior |
| `nodrift-troubleshooting` | When errors occur | Autonomous root-cause debugging, evidence-first investigation, reproduction, test failures, regression prevention |

Install `nodrift-sync` always. Add the other four as needed.

## Install

### Interactive installer (any agent)

```bash
npx nodrift-ai
```

Pick the skills, choose **This project** or **Everywhere**, and select your agents. Existing agent folders are detected and preselected. The installer needs Node 18 or newer and has no dependencies.

For a project install it also adds a short block to `AGENTS.md` (and `CLAUDE.md` for Claude Code) between `<!-- nodrift:start -->` and `<!-- nodrift:end -->`. Rerunning the installer replaces that block in place. Text outside the markers is never touched.

### Open skills directory (skills.sh)

```bash
npx skills add hansendusenov/nodrift
```

### Antigravity plugin

```bash
agy plugin install https://github.com/hansendusenov/nodrift
```

### Claude Code plugin

```text
/plugin marketplace add https://github.com/hansendusenov/nodrift
/plugin install nodrift@nodrift
```

### Codex plugin

```bash
codex plugin marketplace add hansendusenov/nodrift
codex plugin add nodrift@nodrift
```

### OpenClaw, OpenCode, Hermes

Use the interactive installer and select the agent, or use `npx skills`:

```bash
npx nodrift-ai
npx skills add hansendusenov/nodrift
```

Cursor, Cline, and Gemini CLI also have installer targets. See [GUIDE.md](GUIDE.md) for each agent step by step.

### Where the installer writes

| Agent | This project | Everywhere |
| --- | --- | --- |
| Antigravity | `.agents/skills/` | `~/.gemini/config/skills/` |
| Codex, OpenCode, Generic | `.agents/skills/` | `~/.agents/skills/` |
| Hermes | `.agents/skills/` | `~/.hermes/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| OpenClaw | `skills/` | `~/.openclaw/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Cline | `.cline/skills/` | `~/.cline/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |

Agents that share a folder are written once.

## Non-interactive use

```bash
npx nodrift-ai --yes --skills all --agents claude,cursor
npx nodrift-ai --yes --scope global --skills sync --agents claude
```

| Flag | Meaning |
| --- | --- |
| `--yes`, `-y` | Skip the prompts |
| `--skills <list>` | `nodrift-sync`, `nodrift-consultant`, `nodrift-standard`, `nodrift-ui`, `nodrift-troubleshooting`, or `all`. Default: `nodrift-sync` |
| `--scope <scope>` | `project` or `global`. Default: `project` |
| `--agents <list>` | Agent ids. Default: detected agents, else `generic` |
| `--update` | Refresh installed skills and the pointer block |
| `--version`, `-v` | Print the version |
| `--help`, `-h` | Print usage |

## Update

```bash
npx nodrift-ai --update
```

Finds every `nodrift-*` skill folder in the current project and your home directory, replaces it with the latest version, and refreshes the `AGENTS.md` pointer block. Plugin installs update through the agent's own plugin commands. See [GUIDE.md](GUIDE.md).

## Remove

Delete the skill folders and the pointer block:

```bash
rm -rf .agents/skills/nodrift-* .claude/skills/nodrift-*
```

Then delete everything from `<!-- nodrift:start -->` through `<!-- nodrift:end -->` in `AGENTS.md` and `CLAUDE.md`. For plugin installs, use the agent's uninstall command. See [GUIDE.md](GUIDE.md).

## Repository layout

```text
skills/                 The five skills (SKILL.md each)
rules/nodrift.md        Entry rule for agents that read rules/
nodrift.md              Single-file fallback pointer
cli/index.mjs           Zero-dependency installer (npx nodrift-ai)
plugin.json             Antigravity plugin
.agents/plugins/        Marketplace manifest (Codex, Antigravity)
.claude-plugin/         Claude Code plugin and marketplace
.codex-plugin/          Codex plugin
.cursor-plugin/         Cursor plugin
.cline-plugin/          Cline plugin
```

## License

MIT. See [LICENSE](LICENSE).
