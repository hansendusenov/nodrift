# nodrift guide

Install, update, and remove `nodrift` for each agent. For what the skills do, see the [README](README.md).

## Choose a route

| Route | Best when | Updates with |
| --- | --- | --- |
| `npx nodrift-ai` | You want one command for any agent, and the `AGENTS.md` pointer | `npx nodrift-ai --update` |
| `npx skills add` | You already use the skills.sh directory | `npx skills update` |
| Native plugin | Your agent has a plugin system and you want zero copies in the repo | The agent's plugin update command |

Do not combine routes for the same agent in the same scope. Two copies of a skill load twice.

## Interactive installer

Requires Node 18 or newer. No other dependencies.

```bash
npx nodrift-ai
```

1. **Skills.** `nodrift-sync` is preselected. Space toggles, `a` toggles all, Enter confirms.
2. **Scope.** *This project* writes into the current folder. *Everywhere* writes into your home directory, so every project sees the skills.
3. **Agents.** Folders that already exist are detected and preselected. Agents that share a folder are written once.

For *This project* the installer then creates or updates `AGENTS.md` (and `CLAUDE.md` when Claude Code is selected). The block sits between the two markers:

```markdown
<!-- nodrift:start -->
## NoDrift Agent Protocol
At session start, load the installed `nodrift` skills from `.agents/skills/` (or `.claude/skills/`):
- Always follow `nodrift-sync` for cross-agent `.agent-context/` handoff and collision prevention.
- Follow `nodrift-consultant` when scoping new projects or architectures.
- Follow `nodrift-standard` for `.env` hygiene, architectural boundaries, `scripts/` execution, and self-code review.
<!-- nodrift:end -->
```

- If the file does not exist, it is created.
- If the file exists without the markers, the block is appended after your content.
- If the markers exist, only the text between them is replaced. Running the installer ten times leaves one block.
- If only one of the two markers exists, the file is left untouched and a warning is printed. Fix the markers and rerun.

A global install does not write a pointer, because there is no project file to put it in. Run the installer once per project with *This project* to add it.

### Scripted install

```bash
npx nodrift-ai --yes --skills all --agents claude,cursor
npx nodrift-ai --yes --scope global --skills sync --agents claude,antigravity
```

`--yes` uses `nodrift-sync`, scope `project`, and the detected agents (else `generic`) for anything you leave out.

Agent ids: `antigravity`, `codex`, `opencode`, `hermes`, `claude`, `openclaw`, `cursor`, `cline`, `gemini`, `generic`.

### Update

```bash
npx nodrift-ai --update
```

Run it from the project root. It looks in every agent folder, in the project and in your home directory, and replaces each `nodrift-*` skill it finds with the version in the package. Files you added inside a skill folder are removed, so keep local changes elsewhere. It also refreshes the `AGENTS.md` / `CLAUDE.md` pointer block when the project has one. Nothing is installed that was not installed before.

To get new skill versions, run it with the latest package: `npx nodrift-ai@latest --update`.

### Remove

Delete the skill folders for the agents you installed to, then the pointer block.

```bash
# project
rm -rf .agents/skills/nodrift-* .claude/skills/nodrift-* .cursor/skills/nodrift-* .cline/skills/nodrift-* .gemini/skills/nodrift-* skills/nodrift-*

# global
rm -rf ~/.agents/skills/nodrift-* ~/.claude/skills/nodrift-* ~/.gemini/config/skills/nodrift-* ~/.hermes/skills/nodrift-* ~/.openclaw/skills/nodrift-*
```

Only run the `skills/nodrift-*` line in a project that is not the nodrift repository itself.

On Windows PowerShell, use `Remove-Item -Recurse -Force .agents\skills\nodrift-*`.

Then open `AGENTS.md` and `CLAUDE.md` and delete everything from `<!-- nodrift:start -->` through `<!-- nodrift:end -->`, including both marker lines. The `.agent-context/` folder is project state, not part of the install. Keep or delete it as you like.

## Antigravity

Plugin:

```bash
agy plugin install https://github.com/hansendusenov/nodrift
```

Or the installer. Antigravity reads `.agents/skills/` in a project and `~/.gemini/config/skills/` globally:

```bash
npx nodrift-ai
```

Update: `npx nodrift-ai --update`, or reinstall the plugin. Remove: delete the skill folders as above, or uninstall the plugin with `agy plugin`.

## Claude Code

Plugin:

```text
/plugin marketplace add https://github.com/hansendusenov/nodrift
/plugin install nodrift@nodrift
```

Or the installer, which writes `.claude/skills/` and the `CLAUDE.md` pointer:

```bash
npx nodrift-ai
```

Update the plugin: `/plugin marketplace update nodrift`. Remove: `/plugin uninstall nodrift@nodrift`.

## Codex

Plugin:

```bash
codex plugin marketplace add hansendusenov/nodrift
codex plugin add nodrift@nodrift
```

Or the installer. Codex reads `.agents/skills/` in a project and `~/.agents/skills/` globally:

```bash
npx nodrift-ai
```

Update and remove the plugin with the matching `codex plugin` subcommands. Run `codex plugin --help` to see what your version offers.

## Cursor

Use the installer. It writes `.cursor/skills/`:

```bash
npx nodrift-ai
```

The repository also ships `.cursor-plugin/plugin.json` for Cursor's plugin flow. Update with `npx nodrift-ai --update`.

## Cline

Use the installer. It writes `.cline/skills/`:

```bash
npx nodrift-ai
```

The repository also ships `.cline-plugin/plugin.json`. Update with `npx nodrift-ai --update`.

## Gemini CLI

Use the installer and select **Gemini CLI**. It writes `.gemini/skills/` (project) or `~/.gemini/skills/` (global):

```bash
npx nodrift-ai
```

## OpenClaw

Use the installer and select **OpenClaw**. It writes `skills/` in the workspace, or `~/.openclaw/skills/` globally:

```bash
npx nodrift-ai
```

Or use the open skills directory:

```bash
npx skills add hansendusenov/nodrift
```

## OpenCode

Use the installer and select **OpenCode**. It writes `.agents/skills/` (project) or `~/.agents/skills/` (global):

```bash
npx nodrift-ai
```

Or `npx skills add hansendusenov/nodrift`.

## Hermes

Use the installer and select **Hermes**. It writes `.agents/skills/` (project) or `~/.hermes/skills/` (global):

```bash
npx nodrift-ai
```

Or `npx skills add hansendusenov/nodrift`.

## Open skills directory (skills.sh)

Works for any agent the `skills` CLI supports:

```bash
npx skills add hansendusenov/nodrift
```

Pick the agents when prompted. Manage it later with the `skills` CLI itself (`npx skills update`, `npx skills remove`).

## No installer, no plugin

Copy [`nodrift.md`](nodrift.md) and the `skills/` folder into the project, then reference `nodrift.md` from your agent's instructions file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.clinerules`).

## Troubleshooting

**The agent does not seem to follow the skills.** Start a new session. Skills are read at session start. Confirm the folder exists for your agent, for example `.agents/skills/nodrift-sync/SKILL.md`.

**`The interactive installer needs a terminal`.** You ran it without a TTY (CI, a pipe). Pass `--yes` with `--skills`, `--scope`, `--agents`.

**`found one nodrift marker without its pair`.** `AGENTS.md` has a lone `<!-- nodrift:start -->` or `<!-- nodrift:end -->`. Delete the stray marker and rerun.

**`skipped, this is the package source folder`.** You ran the installer inside the nodrift repository for an agent whose folder is the repo's own `skills/`. Nothing is overwritten. Run it in your own project.
