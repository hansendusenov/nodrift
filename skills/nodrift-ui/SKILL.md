---
name: nodrift-ui
description: Guardrails for building or reviewing frontend UI, covering an anti-slop filter (generic AI layouts, filler copy, fake data), UX completeness (loading, empty, error, success, and interactive states), accessibility, and responsive behavior, verified with evidence before delivery. Use when building, redesigning, or reviewing web pages, app screens, dashboards, forms, or UI components, including CSS and Tailwind work, even if the user never mentions design or accessibility. Supplies guardrails, not aesthetic direction; the look comes from the user's brand, an existing design system, or a design-direction skill. For tiny style tweaks (one color, one margin, a copy fix) only Section 0 applies.
---

# NoDrift UI/UX & Anti-Slop Protocol

Act as a Senior Product Designer and UI Engineer. An interface should look and behave like a crafted product, not a generic template. This protocol defines what to avoid and what must exist. It does not decide what the product should look like.

---

## 0. Precedence & Scope

When rules conflict, the higher one wins:
1. **The user's explicit instructions.** The bans below are defaults; a requested gradient or glass look is fine.
2. **The existing design system:** tokens, theme files, CSS variables, component library, spacing and type scales, brand colors. Check for them first (Tailwind config, theme file, `globals.css`, shadcn/MUI/etc.) and follow them. Don't impose this document's scales on an established system.
3. **A design-direction skill, if one is loaded, or the `Conventions` field in `.agent-context/BLUEPRINT.md`.**
4. **This document's defaults,** for new work where nothing is established.

**Scope.** A new screen, component, or page gets the full pass. A tiny tweak gets Section 0 and a check of the area you touched.

**With the other NoDrift skills.** Global styles, token files, and layout shells are common collision points: claim them as `nodrift-sync` describes. Component code follows `nodrift-standard` layering (no queries or business rules in components). Record the chosen UI kit and token file path in the blueprint's `Conventions`.

---

## 1. Derive, Don't Default

Banning one cliché pushes agents toward the next default, so give every new screen a reason to look the way it does.

- **Write a one-line design intent first:** what the product is, who uses it, and the screen's primary job. Take density, tone, palette, and type from that. An analyst dashboard is dense, tabular, and restrained; a children's app has large targets and warmth.
- **If the brief doesn't say,** state your assumption (or ask) instead of inventing a generic answer.
- **If no direction exists at all,** choose deliberately: one accent hue, one neutral ramp, one or two typefaces, with a one-line reason for each. Don't reuse the same font, accent, and card style on every project.

---

## 2. The Anti-Slop Filter

These patterns read as template output and make interfaces interchangeable. Avoid them unless the user asks for them or they belong to the existing brand.

### 2.1 Visual clichés
- **AI glow:** unprompted purple-to-blue or cyan neon gradients, glowing background orbs, heavy glassmorphism over dark backgrounds.
- **Sparkle and hype badges:** ✨ and 🚀, and floating pills above the hero headline ("NEXT-GEN 2.0", "AI-POWERED"). A badge that states a real fact (the product is actually in beta, a dated "New") is information and stays.
- **Clone card grids:** identical centered cards with a round icon, a title, and two vague lines. A grid is fine when each card carries real, different content; the template with filler copy is the problem.
- **Decorative noise:** fake terminal windows, non-functional search bars, decorative charts, floating UI cards with no purpose.
- **Emoji as icons or bullets.** Use one consistent icon set (SVG) with uniform size and stroke.
- **Second-wave defaults:** gradient text, bento layouts everywhere, one rounded card with the same soft shadow on every block, an all-caps eyebrow above every heading.
- **Comment decoration:** no ASCII banners or emoji in CSS, JSX, or HTML comments.

### 2.2 Copy & data
- **Banned buzzwords:** "Unlock the power of...", "Supercharge your workflow", "Elevate your experience", "Seamless integration", "Revolutionize", "Built for modern teams".
- **Say what it does, plainly.** Name things the way users understand them. A button is a verb plus an object ("Save changes", "Invite teammate"), not "Submit".
- **No invented social proof** in shipped copy: no made-up statistics ("99.9% uptime", "10x faster"), testimonials, "trusted by" counts, or company logos. Without real metrics, describe the actual mechanism.
- **Sample data is allowed for prototypes and dashboards** when it is (a) realistic and specific (varied names and dates, plausible numbers, no "Lorem ipsum" or "John Doe"), (b) kept in a clearly named fixture or mock file or marked with a comment, not buried in markup, and (c) mentioned in your final summary. It must never appear as a marketing claim.
- **Real content you don't have** (pricing, legal text, testimonials): leave a visible placeholder or ask. Don't invent it.
- No emoji bullet lists in UI copy.

---

## 3. UX Architecture & Visual Hierarchy

1. **One primary action per decision context** (a screen, dialog, form, or card). Everything else uses `secondary`, `outline`, or `ghost`. A page with several independent contexts can have a primary in each; what matters is that no two primaries compete inside one.
2. **Spacing and grouping.** Use the project's spacing tokens. With none, use a 4px base scale (4, 8, 12, 16, 24, 32, 48, 64, expressed in `rem`). Group related items by proximity before adding boxes; avoid card-in-card and borders around everything.
3. **Alignment.** Start-align text and use logical properties (`text-start`, `ms-*`, `padding-inline`) so RTL works. Center only short hero headings and empty states, never long paragraphs or multi-item lists.
4. **Typography.** Set a clear scale of 5-6 steps. Large headings (24px and up): tight tracking (about `-0.02em`), line-height `1.15-1.25`. Smaller headings and body text: normal tracking, body line-height `1.5-1.6`, prose width `60ch-70ch`. Tight tracking on small text hurts legibility.
5. **Numbers.** Apply `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) to tables, counters, timestamps, prices, and metrics, and right-align numeric columns.
6. **Tokens, not literals.** Colors, spacing, radii, and type sizes live in tokens (CSS variables or the framework theme), not scattered through components.

---

## 4. Color, Surface & Contrast

1. **Neutral ramp, one accent, semantic colors.** As a heuristic, roughly 60% neutral canvas, 30% structure (surfaces and borders), 10% accent. Use the accent for primary actions, links, selection, and focus. In dark mode avoid pure `#000` and pure `#FFF`; build elevation with lighter surfaces.
2. **Semantic colors for feedback only:** red (danger), amber (warning), green (success), blue (info). If the brand accent is blue, keep info distinct with an icon and label. Charts get their own categorical palette that doesn't collide with the semantic colors.
3. **Never rely on color alone.** Status, errors, required fields, and links inside text also carry text, an icon, or an underline.
4. **Contrast (WCAG 2.2 AA):**
   - Text needs **4.5:1**. Only *large* text may use **3:1**, and large means at least **24px regular or 18.66px (14pt) bold**. Regular text between 18px and 23px is still normal text.
   - **Non-text:** borders that identify a control (inputs), meaningful icons, focus rings, and chart marks need **3:1** against adjacent colors. Decorative dividers and disabled elements are exempt.
   - Use the unrounded ratio (4.49 fails). Check every state (hover, active, focus, selected) and every theme.
5. **Themes.** If the project has dark mode (or follows `prefers-color-scheme`), define both through tokens and check both. Don't ship a half-themed screen.

---

## 5. Application States

Apply the states that fit the component. Plain content with no data and no interaction needs none of them.

| Component | States to cover |
| :--- | :--- |
| Data-driven view | populated, loading, empty, error |
| Form | validation, pending submit, error, success |
| Any interactive element | hover, active, disabled, focus-visible |

1. **Populated.** Handle short and extreme content: long text (`truncate` or `line-clamp`, with the full text reachable), missing images (initials or icon fallback), very large numbers, long lists (paginate or virtualize), and translated text that runs 30-40% longer.
2. **Loading.** Geometry-accurate skeletons or a small inline spinner, with no layout shift (reserve image space with `width`/`height` or `aspect-ratio`). Buttons that trigger async work disable immediately and show a pending state, so a double click can't submit twice. Mark the loading region `aria-busy`.
3. **Empty.** Never a blank box or a bare "No data found". Explain why it is empty and offer the next action (create or import the first item). If filters caused it, say there are no results and offer "Reset filters". If the view is read-only, say so.
4. **Error and validation.**
   - Field errors go inline under the field and say how to fix the problem. Wire them with `aria-invalid="true"` and `aria-describedby`.
   - On a failed submit, move focus to the first invalid field.
   - Network and API failures offer a retry and keep what the user already typed.
   - Announce dynamic errors with `role="alert"` or `aria-live`.
   - Page-level failures (not found, permission denied, server error) say what happened and what to do next.
5. **Success and destructive actions.** Confirm completed actions, reusing the action's name ("Publish" produces "Published"). Destructive actions either name what will be deleted in a confirmation or, better, offer an undo window.
6. **Interactive and keyboard.** Give every control distinct `:hover`, `:active`, `:disabled`, and `:focus-visible` styles. Wrap hover-only styling in `@media (hover: hover)`, and never make hover the only way to reveal something. Never remove `outline` without a `:focus-visible` replacement that meets 3:1 and isn't hidden under a sticky header (use `scroll-padding`).

---

## 6. Accessibility Essentials

- **Semantic HTML first:** `button` for actions, `a` for navigation, headings in order, landmarks (`header`, `nav`, `main`), real lists. No clickable `div`s.
- **Names and alt text:** icon-only buttons get an accessible name (`aria-label`). Images get meaningful `alt`, or `alt=""` when decorative.
- **Keyboard:** everything is reachable and operable in a logical tab order. Modals trap focus, close on Esc, and return focus to the trigger.
- **Motion:** purposeful and short (about 150-250ms). Honor `prefers-reduced-motion`, including skeleton shimmer.
- **Scaling:** size type in `rem` and make sure the layout survives 200% zoom.

---

## 7. Responsive Ergonomics & Layout Integrity

1. **No horizontal overflow** at 320px, 768px, and 1440px+, and at the widths between where layouts tend to break. Wide tables and code scroll inside their own container.
2. **Touch targets.** Aim for 44x44px on touch layouts; the visual element may be smaller if padding extends the hit area. WCAG 2.2 AA sets a floor of 24x24 CSS px (SC 2.5.8), so dense desktop controls can sit between the two.
3. **Wide data tables** either scroll horizontally with a sticky identifier column or turn into key-value cards on small screens.
4. **Forms.** Always a visible `<label>` (a placeholder is not a label). Set `type`, `inputMode`, and `autocomplete`. Keep input font size at 16px or more, since iOS Safari zooms into smaller inputs. Default to a single column; closely related short fields (city and postal code) may pair.
5. **Mobile viewport.** Include the viewport meta tag, use `min-height: 100dvh` instead of `100vh`, and respect safe-area insets (`env(safe-area-inset-*)`) on fixed bars.

---

## 8. Pre-Delivery Verification (Evidence, Not Impression)

Verify by doing, not by ticking boxes from memory:

1. **Render it** in a browser or screenshot at 320, 768, and 1440px. If the environment can't render, say so and don't claim visual or responsive checks.
2. **Keyboard pass:** Tab through the screen. Focus is visible, the order is logical, and modals can be exited.
3. **Contrast:** compute the real color pairs from the tokens or CSS with the WCAG formula or a checker, per state and theme. Don't eyeball it.
4. **States:** force loading, empty, and error (mock the data, fail or throttle the request) and look at each one.
5. **Console and lint:** no errors or warnings, and the project's lint and type check pass (through the `nodrift-standard` scripts if the project has them).
6. **Grep for leftovers:** lorem ipsum, placeholder copy, invented stats, sparkle emoji, `outline: none` with no replacement.

Then confirm the five gates:
- [ ] **Anti-slop:** no generic glow gradients, hype badges, invented stats, or buzzwords.
- [ ] **Hierarchy:** no competing primary actions in one context, `tabular-nums` on numbers, no card-in-card clutter.
- [ ] **Contrast:** text, control borders, and focus rings meet 4.5:1 / 3:1 in every state and theme.
- [ ] **States:** the loading, empty, error, success, and focus states that apply are implemented.
- [ ] **Responsive:** no overflow at 320px, labels wired, inputs at 16px or more.

Report to the user in a few lines: what you checked, what failed or couldn't be checked, and any sample data you used. Never claim a check you did not run.
