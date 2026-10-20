#!/usr/bin/env node
// nodrift-ai installer. Zero dependencies, Node >= 18.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = path.resolve(HERE, '..')
const SKILLS_SRC = path.join(PKG_ROOT, 'skills')

export const VERSION = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version

export const SKILLS = [
  { name: 'nodrift-sync', recommended: true, hint: 'cross-agent handoff, crash recovery, collision prevention' },
  { name: 'nodrift-consultant', recommended: false, hint: 'pre-coding architecture and BLUEPRINT.md' },
  { name: 'nodrift-standard', recommended: false, hint: 'tech lead standards: .env, layers, scripts/, self-review' },
]

// `project` is relative to the workspace, `global` relative to the home directory.
// Agents that share a folder (for example .agents/skills) are installed once.
export const AGENTS = [
  { id: 'antigravity', label: 'Antigravity', project: '.agents/skills', global: '.gemini/config/skills', markers: ['.agents', '.gemini'] },
  { id: 'codex', label: 'Codex', project: '.agents/skills', global: '.agents/skills', markers: ['.codex'] },
  { id: 'opencode', label: 'OpenCode', project: '.agents/skills', global: '.agents/skills', markers: ['.opencode', 'opencode.json', '.config/opencode'] },
  { id: 'hermes', label: 'Hermes', project: '.agents/skills', global: '.hermes/skills', markers: ['.hermes'] },
  { id: 'claude', label: 'Claude Code', project: '.claude/skills', global: '.claude/skills', markers: ['.claude', 'CLAUDE.md'] },
  { id: 'openclaw', label: 'OpenClaw', project: 'skills', global: '.openclaw/skills', markers: ['.openclaw', 'openclaw.json'] },
  { id: 'cursor', label: 'Cursor', project: '.cursor/skills', global: '.cursor/skills', markers: ['.cursor'] },
  { id: 'cline', label: 'Cline', project: '.cline/skills', global: '.cline/skills', markers: ['.cline', '.clinerules'] },
  { id: 'gemini', label: 'Gemini CLI', project: '.gemini/skills', global: '.gemini/skills', markers: ['GEMINI.md'] },
  { id: 'generic', label: 'Generic (.agents/skills)', project: '.agents/skills', global: '.agents/skills', markers: ['.agents'] },
]

export const START = '<!-- nodrift:start -->'
export const END = '<!-- nodrift:end -->'
const POINTER_LINES = [
  START,
  '## NoDrift Agent Protocol',
  'At session start, load the installed `nodrift` skills from `.agents/skills/` (or `.claude/skills/`):',
  '- Always follow `nodrift-sync` for cross-agent `.agent-context/` handoff and collision prevention.',
  '- Follow `nodrift-consultant` when scoping new projects or architectures.',
  '- Follow `nodrift-standard` for `.env` hygiene, architectural boundaries, `scripts/` execution, and self-code review.',
  END,
]

// ---------- terminal helpers ----------

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s)
const bold = paint(1)
const dim = paint(2)
const red = paint(31)
const green = paint(32)
const yellow = paint(33)
const cyan = paint(36)

class UsageError extends Error {}
class Cancelled extends Error {}

function fit(text, max) {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`
}

// Arrow-key prompt. `multi` gives checkboxes, otherwise a single choice.
// input/output are injectable so the prompt can be driven without a real terminal.
export function choose({ message, options, multi = false, input = process.stdin, output = process.stdout }) {
  return new Promise((resolve, reject) => {
    const picked = new Set(options.filter((o) => o.checked).map((o) => o.value))
    let cursor = Math.max(0, options.findIndex((o) => o.checked))
    let error = ''
    let drawn = 0

    const maxWidth = () => Math.max(24, (output.columns || 80) - 1)

    const render = () => {
      const width = maxWidth()
      const lines = [`${cyan('?')} ${bold(fit(message, width - 2))}`]
      lines.push(dim(`  ${multi ? 'up/down move, space toggle, a all, enter confirm' : 'up/down move, enter confirm'}`))
      options.forEach((o, i) => {
        const pointer = i === cursor ? cyan('>') : ' '
        const mark = multi ? (picked.has(o.value) ? green('[x]') : '[ ]') : i === cursor ? green('(*)') : '( )'
        const room = width - 6 - o.label.length - 2
        const hint = o.hint && room >= 8 ? `  ${dim(fit(o.hint, room))}` : ''
        lines.push(`${pointer} ${mark} ${i === cursor ? bold(o.label) : o.label}${hint}`)
      })
      if (error) lines.push(yellow(`  ${error}`))
      if (drawn) output.write(`\x1b[${drawn}A\r\x1b[0J`)
      output.write(`${lines.join('\n')}\n`)
      drawn = lines.length
    }

    const cleanup = () => {
      input.off('keypress', onKey)
      if (input.setRawMode) input.setRawMode(false)
      input.pause()
      output.write('\x1b[?25h')
      if (drawn) output.write(`\x1b[${drawn}A\r\x1b[0J`)
    }

    const finish = (answer, summary) => {
      cleanup()
      output.write(`${green('✓')} ${bold(message)}  ${dim(summary)}\n`)
      resolve(answer)
    }

    function onKey(_str, key = {}) {
      if (key.ctrl && key.name === 'c') {
        cleanup()
        reject(new Cancelled())
        return
      }
      error = ''
      switch (key.name) {
        case 'up':
        case 'k':
          cursor = (cursor - 1 + options.length) % options.length
          break
        case 'down':
        case 'j':
          cursor = (cursor + 1) % options.length
          break
        case 'space':
          if (multi) {
            const v = options[cursor].value
            if (picked.has(v)) picked.delete(v)
            else picked.add(v)
          }
          break
        case 'a':
          if (multi) {
            if (picked.size === options.length) picked.clear()
            else options.forEach((o) => picked.add(o.value))
          }
          break
        case 'return':
        case 'enter': {
          if (!multi) {
            finish(options[cursor].value, options[cursor].label)
            return
          }
          const values = options.filter((o) => picked.has(o.value)).map((o) => o.value)
          if (values.length === 0) {
            error = 'Select at least one (space to toggle).'
            break
          }
          finish(values, options.filter((o) => picked.has(o.value)).map((o) => o.label).join(', '))
          return
        }
        default:
      }
      render()
    }

    readline.emitKeypressEvents(input)
    if (input.setRawMode) input.setRawMode(true)
    input.resume()
    output.write('\x1b[?25l')
    input.on('keypress', onKey)
    render()
  })
}

// ---------- pointer block ----------

export function upsertPointer(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const block = POINTER_LINES.join(eol)
  const start = text.indexOf(START)
  const end = text.indexOf(END, start + 1)

  if (start !== -1 && end !== -1) {
    const next = text.slice(0, start) + block + text.slice(end + END.length)
    return { text: next, status: next === text ? 'unchanged' : 'updated' }
  }
  if (start !== -1 || text.indexOf(END) !== -1) {
    return { text, status: 'malformed' }
  }
  if (text.trim() === '') return { text: block + eol, status: 'created' }
  const body = text.endsWith('\n') ? text : text + eol
  return { text: `${body}${eol}${block}${eol}`, status: 'appended' }
}

export function syncPointerFile(file) {
  const exists = fs.existsSync(file)
  const current = exists ? fs.readFileSync(file, 'utf8') : ''
  const result = upsertPointer(current)
  if (result.status === 'malformed') return 'malformed'
  if (result.status !== 'unchanged') fs.writeFileSync(file, result.text)
  return result.status === 'created' && exists ? 'appended' : result.status
}

function hasPointer(file) {
  return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(START)
}

function reportPointer(file, status, base) {
  const rel = path.relative(base, file) || file
  if (status === 'malformed') {
    console.log(`  ${yellow('!')} ${rel}: found one nodrift marker without its pair, left untouched. Fix the markers and rerun.`)
  } else {
    console.log(`  ${green('+')} ${rel}: pointer block ${status}`)
  }
}

// ---------- install ----------

// Real path when the target exists, so symlinks and drive-letter case (d:\ vs D:\) compare equal.
function canonical(p) {
  let resolved = path.resolve(p)
  try {
    resolved = fs.realpathSync.native(resolved)
  } catch {
    // not created yet: fall back to the resolved path
  }
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

const same = (a, b) => canonical(a) === canonical(b)

function isInside(child, parent) {
  const rel = path.relative(canonical(parent), canonical(child))
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

export function installSkill(name, targetDir) {
  const src = path.join(SKILLS_SRC, name)
  const dest = path.join(targetDir, name)
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) throw new Error(`Skill "${name}" is missing from the package (${src}).`)
  // The install replaces dest, so never let dest be, or sit inside, the package's own skills.
  if (same(src, dest) || isInside(dest, SKILLS_SRC)) return 'source'
  const existed = fs.existsSync(dest)
  fs.mkdirSync(targetDir, { recursive: true })
  fs.rmSync(dest, { recursive: true, force: true })
  fs.cpSync(src, dest, { recursive: true })
  return existed ? 'updated' : 'installed'
}

function targetDir(agent, scope, cwd, home) {
  return scope === 'global' ? path.join(home, agent.global) : path.join(cwd, agent.project)
}

// Group chosen agents by destination folder so a shared folder is written once.
function planTargets(agentIds, scope, cwd, home) {
  const plan = new Map()
  for (const id of agentIds) {
    const agent = AGENTS.find((a) => a.id === id)
    const dir = path.resolve(targetDir(agent, scope, cwd, home))
    if (!plan.has(dir)) plan.set(dir, [])
    plan.get(dir).push(agent.label)
  }
  return plan
}

function detect(base) {
  return AGENTS.filter((a) => a.markers.some((m) => fs.existsSync(path.join(base, m)))).map((a) => a.id)
}

function runInstall({ skills, scope, agentIds }, cwd, home) {
  const base = scope === 'global' ? home : cwd
  const plan = planTargets(agentIds, scope, cwd, home)
  console.log()
  for (const [dir, labels] of plan) {
    console.log(`${bold(path.relative(base, dir) || dir)}  ${dim(`(${labels.join(', ')})`)}`)
    for (const name of skills) {
      const outcome = installSkill(name, dir)
      const note = outcome === 'source' ? 'skipped, this is the package source folder' : outcome
      console.log(`  ${green('+')} ${name} ${dim(note)}`)
    }
  }

  if (scope === 'project') {
    console.log()
    const files = ['AGENTS.md']
    if (agentIds.includes('claude')) files.push('CLAUDE.md')
    for (const f of files) {
      const file = path.join(cwd, f)
      reportPointer(file, syncPointerFile(file), cwd)
    }
  } else {
    console.log(`\n${dim('Global install: no AGENTS.md pointer is written. Add it per project with `npx nodrift-ai` (This project).')}`)
  }
  console.log(`\n${green('Done.')} Start a new agent session so it picks up the skills.`)
}

// ---------- update ----------

function installedSkills(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((n) => n.startsWith('nodrift-'))
    .filter((n) => fs.existsSync(path.join(SKILLS_SRC, n, 'SKILL.md')))
    .filter((n) => fs.statSync(path.join(dir, n)).isDirectory())
}

export function runUpdate(cwd = process.cwd(), home = os.homedir()) {
  const dirs = new Map()
  for (const [scope, base] of [['project', cwd], ['global', home]]) {
    for (const agent of AGENTS) {
      const dir = path.resolve(targetDir(agent, scope, cwd, home))
      if (same(dir, SKILLS_SRC)) continue
      if (!dirs.has(dir)) dirs.set(dir, { scope, base, agentIds: [] })
      dirs.get(dir).agentIds.push(agent.id)
    }
  }

  let total = 0
  let projectFound = false
  let claudeFound = false
  for (const [dir, info] of dirs) {
    const names = installedSkills(dir)
    if (names.length === 0) continue
    console.log(`${bold(path.relative(info.base, dir) || dir)}  ${dim(`(${info.scope})`)}`)
    for (const name of names) {
      console.log(`  ${green('+')} ${name} ${dim(installSkill(name, dir))}`)
      total++
    }
    if (info.scope === 'project') {
      projectFound = true
      if (info.agentIds.includes('claude')) claudeFound = true
    }
  }

  if (total === 0) {
    console.log('No installed nodrift skills found in this project or your home directory.')
    console.log('Run `npx nodrift-ai` to install them.')
    return
  }

  const pointers = [['AGENTS.md', projectFound], ['CLAUDE.md', claudeFound]]
  for (const [name, wanted] of pointers) {
    const file = path.join(cwd, name)
    if (wanted || hasPointer(file)) reportPointer(file, syncPointerFile(file), cwd)
  }
  console.log(`\n${green('Updated')} ${total} skill folder${total === 1 ? '' : 's'} to nodrift ${VERSION}.`)
}

// ---------- arguments ----------

const HELP = `nodrift-ai ${VERSION}
Stop context loss and architectural drift across AI coding agents.

Usage
  npx nodrift-ai [options]

With no options the installer is interactive: pick skills, a scope
(this project or everywhere), and the agents to install for.

Options
  --update             Refresh every installed nodrift-* skill found in this
                       project and your home directory, and the AGENTS.md pointer
  -y, --yes            Skip the prompts and use flags or defaults
      --skills <list>  Comma-separated: nodrift-sync, nodrift-consultant,
                       nodrift-standard, or "all"   (default with --yes: nodrift-sync)
      --scope <scope>  project | global             (default with --yes: project)
      --agents <list>  Comma-separated agent ids    (default with --yes: detected, else generic)
  -v, --version        Print the version
  -h, --help           Print this help

Agent ids
${AGENTS.map((a) => `  ${a.id.padEnd(12)} ${a.project}  |  ~/${a.global}`).join('\n')}

Examples
  npx nodrift-ai
  npx nodrift-ai --update
  npx nodrift-ai --yes --skills all --agents claude,cursor
`

export function parseArgs(argv) {
  const opts = { update: false, yes: false, help: false, version: false, skills: null, scope: null, agents: null }
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]
    const eq = raw.indexOf('=')
    const flag = raw.startsWith('--') && eq !== -1 ? raw.slice(0, eq) : raw
    const value = () => {
      if (raw.startsWith('--') && eq !== -1) return raw.slice(eq + 1)
      const next = argv[++i]
      if (next === undefined || next.startsWith('-')) throw new UsageError(`${flag} needs a value.`)
      return next
    }
    switch (flag) {
      case '--update': opts.update = true; break
      case '-y': case '--yes': opts.yes = true; break
      case '-h': case '--help': opts.help = true; break
      case '-v': case '--version': opts.version = true; break
      case '--skills': opts.skills = value(); break
      case '--scope': opts.scope = value(); break
      case '--agents': opts.agents = value(); break
      default: throw new UsageError(`Unknown option: ${raw}`)
    }
  }
  return opts
}

const csv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

function resolveSkills(list) {
  const all = SKILLS.map((s) => s.name)
  if (!list) return SKILLS.filter((s) => s.recommended).map((s) => s.name)
  const items = csv(list)
  if (items.includes('all')) return all
  return items.map((item) => {
    const name = item.startsWith('nodrift-') ? item : `nodrift-${item}`
    if (!all.includes(name)) throw new UsageError(`Unknown skill "${item}". Choose from: ${all.join(', ')}, all.`)
    return name
  })
}

function resolveScope(scope) {
  if (!scope) return 'project'
  if (scope !== 'project' && scope !== 'global') throw new UsageError('--scope must be "project" or "global".')
  return scope
}

function resolveAgents(list, base) {
  if (!list) {
    const found = detect(base)
    return found.length ? found : ['generic']
  }
  return csv(list).map((id) => {
    if (!AGENTS.some((a) => a.id === id)) throw new UsageError(`Unknown agent "${id}". Choose from: ${AGENTS.map((a) => a.id).join(', ')}.`)
    return id
  })
}

// ---------- main ----------

async function interactive(cwd, home) {
  console.log(`\n${bold('nodrift')} ${dim(VERSION)}  ${dim('stop context loss and architectural drift')}\n`)

  const skills = await choose({
    message: 'Which skills do you want to install?',
    multi: true,
    options: SKILLS.map((s) => ({
      value: s.name,
      label: s.recommended ? `${s.name} (recommended)` : s.name,
      hint: s.hint,
      checked: s.recommended,
    })),
  })

  const scope = await choose({
    message: 'Where should they be installed?',
    options: [
      { value: 'project', label: 'This project', hint: cwd, checked: true },
      { value: 'global', label: 'Everywhere', hint: `${home} (all projects)` },
    ],
  })

  const base = scope === 'global' ? home : cwd
  const detected = detect(base)
  const preselect = detected.length ? detected : ['generic']
  const agentIds = await choose({
    message: 'Which agents do you use?',
    multi: true,
    options: AGENTS.map((a) => ({
      value: a.id,
      label: a.label,
      hint: `${scope === 'global' ? `~/${a.global}` : a.project}${detected.includes(a.id) ? '  (detected)' : ''}`,
      checked: preselect.includes(a.id),
    })),
  })

  runInstall({ skills, scope, agentIds }, cwd, home)
}

async function main(argv) {
  const opts = parseArgs(argv)
  if (opts.version) return console.log(VERSION)
  if (opts.help) return process.stdout.write(HELP)

  const cwd = process.cwd()
  const home = os.homedir()

  if (opts.update) return runUpdate(cwd, home)

  const scripted = opts.yes || opts.skills || opts.scope || opts.agents
  if (scripted) {
    const scope = resolveScope(opts.scope)
    const base = scope === 'global' ? home : cwd
    return runInstall({ skills: resolveSkills(opts.skills), scope, agentIds: resolveAgents(opts.agents, base) }, cwd, home)
  }

  if (!process.stdin.isTTY) {
    throw new UsageError('The interactive installer needs a terminal. Run it in a shell, or pass --yes with --skills, --scope, --agents.')
  }
  return interactive(cwd, home)
}

function isEntryPoint() {
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  main(process.argv.slice(2)).catch((err) => {
    if (err instanceof Cancelled) {
      console.log('\nCancelled. Nothing was written.')
      process.exit(130)
    }
    console.error(`${red('nodrift:')} ${err.message}`)
    if (err instanceof UsageError) console.error('Run `nodrift-ai --help` for usage.')
    process.exit(1)
  })
}
