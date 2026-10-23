---
name: nodrift-troubleshooting
description: Systematic root-cause debugging for runtime errors, wrong output, failing builds or tests, flaky tests, environment and database problems, and regressions. Use whenever something errors, crashes, or behaves unexpectedly, such as when the user pastes a stack trace or log, says "it doesn't work" or "kok error", a build or test fails, or output is wrong, even if nobody says "debug". Enforces evidence before edits, reproduction before fixes, verification after, and a stop rule against blind retries. Trivial, self-evident errors (a missing import with a clear message) use the compressed path in Section 0.
---

# NoDrift Troubleshooting & Root-Cause Protocol

Act as a Principal Debugging Engineer. A fix you cannot tie to evidence is a guess, and guesses pile up as broken code. Work in this order: evidence, hypothesis, reproduction, fix, verification.

---

## 0. Scope, Scaling & Autonomy Boundaries

- **Scale the loop.** If the error names its own cause and the fix is one obvious line (a typo, a missing import, a renamed file), read the full error, fix it, re-run, and confirm. Everything else gets the full loop in Section 2. The hard gate in Section 1 applies either way.
- **Chat only, no repo or tools.** Analyze the trace, rank hypotheses by likelihood with the check that would confirm each, and ask for the specific file, command output, or log lines you need. Don't present a guess as a conclusion.
- **Ask the user first** before any of these:
  - destructive data operations (drop, reset, truncate) or non-idempotent scripts;
  - anything that touches production data or services, including reproducing against them;
  - installing or upgrading dependencies beyond what the fix needs;
  - changing credentials, permissions, or infrastructure;
  - killing a process you did not start;
  - force-pushing or rewriting git history.

  If the failure is live in production, lay out the options (rollback, feature flag, hotfix) and let the user choose; don't patch production silently.
- **Other NoDrift skills.** The shared-working-tree rules of `nodrift-sync` apply to every edit and git command while debugging. Secrets, scripts, lint, and tests follow `nodrift-standard`.

---

## 1. Hard Gate: What Never Counts as a Fix

1. **Shotgun debugging:** editing code before you have read the complete error output and inspected the failing line.
2. **Symptom suppression:**
   - empty `catch {}` blocks or ignored `err != nil` checks;
   - `any`, `@ts-ignore`, `# type: ignore`, or `eslint-disable` used to silence a type or lint error without proving the underlying contract is sound;
   - deleting, skipping (`.skip`), or weakening a test, or blindly updating snapshots or golden files, just to get green. A test may change only when you can show its expectation is wrong, and you tell the user so;
   - hardcoding return values to fake a passing result.
3. **Repeating failed hypotheses.** If `.agent-context/` exists, read your track's `Decisions / Failed Attempts` in `STATE.md`. Grep `HISTORY.md` for the error message, module name, and file names, and read only the matching entries; don't read the whole file. Never retry an approach already shown to fail.

---

## 2. The Debugging Loop

### Phase 1: Freeze & Gather Evidence (no code edits)
1. **Capture the exact signals:** full error message, exit code, stack trace, and the log lines around it, without truncating either end. Find the **first** error, not the loudest one, because later errors are often cascades. Turn on verbose or debug flags when the output is thin. Redact secrets and tokens when quoting logs.
2. **Rule out the cheap explanations:** a stale process or occupied port, stale build output or cache, dependencies not reinstalled after a pull, the wrong branch or runtime version, a missing env key.
3. **Check the recent delta.** Run `git status -s`, `git diff --stat` (then per-file diffs, since a full diff can be huge), and `git log -n 10 --oneline`. In a shared working tree the diff includes other agents' changes, so attribute each file using the tracks in `STATE.md`. Note which files already had uncommitted changes before you started; Phase 4 needs that baseline.
4. **Regression with a known good point:** bisect. `git bisect` checks out commits and rewrites the working tree, which would destroy uncommitted work, so run it in a throwaway worktree (install dependencies there first):
   ```bash
   git worktree add --detach ../<repo>-bisect <bad-commit>
   cd ../<repo>-bisect && git bisect start <bad-commit> <good-commit> && git bisect run <repro-command>
   # afterwards: git bisect reset; cd -; git worktree remove ../<repo>-bisect
   ```
5. **Classify the failure domain:**
   - **Runtime / crash:** unhandled exception, nil or null pointer, out-of-bounds, missing dependency.
   - **Silent logic bug:** no crash, but a wrong calculation, mutated state, stale cache, off-by-one, or broken branch.
   - **Build / type / dependency:** compiler error, circular import, mismatched package version, lockfile drift.
   - **Environment / config:** missing env key, wrong port, permission denied, path mismatch.
   - **Boundary / integration:** query or schema mismatch, CORS, timeout, serialization or key casing (`snake_case` vs `camelCase`).
   - **Flaky / intermittent:** passes and fails on the same code.
   - **Performance:** works but too slow or too heavy.

   To compare env keys without printing any value:
   ```bash
   keys() { sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' "$1" | sort -u; }
   comm -23 <(keys .env.example) <(keys .env)   # keys in the example that .env lacks
   ```

### Phase 2: Deterministic Reproduction
Before changing logic, find a fast, repeatable way to trigger the bug.
- **Reproduce safely.** Never against production data or services. Don't re-run non-idempotent commands (migrations, payments, emails, destructive scripts) without confirmation; use a test database or fixtures.
- **Confirm it is consistent:** re-run the exact minimal command that fails.
- **Silent logic bugs:** write a minimal test or verification command that fails because of the bug. It becomes your regression test (Phase 5).
- **Intermittent bugs:** measure the failure rate first (run it 20-50 times), then vary one factor at a time: seed, test order, isolation, timing, concurrency. Look for shared state between tests.
- **Can't reproduce?** Say so. Ask for logs, inputs, and environment details, or add targeted logging that captures them. Don't ship a speculative fix and call it verified.

### Phase 3: Root-Cause Analysis (trace backward)
Don't fix where the crash surfaces if the bad data came from upstream.
1. **Pinpoint the failure site:** read the exact file and function from Phase 1.
2. **Trace inputs and state upstream:** the callers, payload schemas, queries, or state stores that feed it.
3. **State a testable hypothesis:** *"The failure occurs at X because upstream component Y passes Z under condition W."*
4. **Test it with the cheapest check that discriminates.** Change one variable at a time. With several candidate hypotheses, pick the check that separates them. If the search space is large, halve it: find which half of the pipeline already holds the bad data.
5. **Instrument if static reading isn't enough.** Tag every diagnostic line with `DEBUG-NODRIFT` so cleanup is one grep. Never log secrets or personal data. In a `[SHARED]` file, keep instrumentation inside your own zone and use targeted edits.
6. **Research when search is available.** Search the exact error string and the dependency's issue tracker or changelog, including the version you run. Treat what you find as a hypothesis to verify locally, never as the answer.

### Phase 4: Surgical Fix & the Two-Strike Rule
1. **Fix the root cause** with the smallest clean change, respecting `nodrift-standard` layer boundaries. One change per attempt, so you know what worked.
2. **Look for sibling occurrences** of the same pattern (an unescaped parameter, a missing null guard, a wrong timezone conversion). Fix them if they sit in files you are already changing. **Report the rest** to the user with locations instead of editing unrelated modules, which widens the diff and risks colliding with other tracks.
3. **Two-strike rule.** A *strike* is a fix attempt that fails the reproduction; investigation steps don't count.
   - **Undo exactly your own change** with a reverse edit of the lines you touched. Don't use `git checkout -- <file>`, `git restore`, `git reset --hard`, or `git stash`: they discard everything uncommitted in the file, including the user's own work and other agents' changes. A per-file checkout is acceptable only when your Phase 1 baseline shows the file was clean and no active track lists it.
   - If a track is open, record the failed hypothesis in one line under `Decisions / Failed Attempts`.
   - Return to Phase 1 with the new evidence.
   - **After two strikes, stop attempting fixes.** You may deepen the investigation (read the dependency's source, reduce to a minimal repro outside the project), but report to the user before trying anything else: the evidence, what is ruled out, the remaining hypotheses, and what you need (a credential, access, logs, a decision).

### Phase 5: Verification, Regression Check & Cleanup
A bug is not resolved because the code looks right. Prove it.
1. **Re-run the reproduction** under the same conditions. For flaky bugs, repeat the same number of runs you used to measure the failure rate.
2. **Run regression checks:** the project's test, build, and lint scripts. Use check mode for linters on `[SHARED]` files. For long runs, refresh your heartbeat first (`nodrift-sync`).
3. **Keep the reproduction as a regression test** when it is stable and well scoped; otherwise delete it.
4. **Remove all diagnostics:** `grep -rn "DEBUG-NODRIFT"` must come back empty, and `git diff -- <your files>` must show only intended changes.
5. **Record what matters.** With an open track, add one line with the root cause and any non-obvious lesson to your block; it carries into the `HISTORY.md` entry at completion (`nodrift-sync` Section 6). With no track, put it in your report to the user.

---

## 3. Domain Playbooks

- **Silent logic / wrong output:** operator precedence, truthy/falsy coercion (`0`, `""`, `null`), timezone and UTC offsets, floating-point rounding, mutated array or object references, early `return` inside loops.
- **Async / concurrency:** missing `await`, unhandled promise rejections, stale closures in UI hooks, unclosed connections or transactions, shared mutable state across goroutines or workers.
- **Database / ORM:** migration status, column nullability, N+1 query loops, locks held by open transactions, parameter binding order.
- **Environment / "works on another machine":** compare env keys (keys only, never values), check runtime versions (`node -v`, `go version`, `python3 --version`), and see what holds a port (`lsof -i :<port>` or `netstat`). Kill only a process you started; if you don't know who owns it, ask.
- **Build / dependency:** don't hand-edit lockfiles. Reinstall through the package manager, and treat dependency changes under `nodrift-sync` Section 5.4 (claim the manifest and lockfile together). Check for circular imports.
- **Frontend / browser:** console errors, the network panel (status, payload, CORS), hydration mismatches, stale caches or service workers. Reproduce at the failing viewport and state (`nodrift-ui` Section 8).
- **CI-only failures:** diff the environment against local (versions, env vars, OS, timezone, case-sensitive paths, parallelism) and recreate CI conditions locally.
- **Performance:** measure first (profile or time it), find the actual bottleneck, change one thing, measure again. No speculative optimization.

---

## 4. Reporting

**When fixed**, keep it short and structured:
1. **Root cause:** why it failed, in 1-2 sentences.
2. **The fix:** which files and functions changed, and why.
3. **Verification:** what you ran and what it showed, plus anything you could not verify.
4. **Follow-ups:** sibling occurrences you found but did not change, and any residual risk.

For a trivial fix, one or two lines are enough.

**When unresolved**, report what you observed, what you ruled out, the remaining hypotheses with the check for each, and what you need from the user.

Never claim a verification you did not run.
