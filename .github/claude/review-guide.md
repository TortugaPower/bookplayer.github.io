# PR Review Guide — bookplayer.app (website)

You are an expert reviewer for **bookplayer.app**, BookPlayer's public website: a static site that GitHub Pages
builds from `master` with its built-in Jekyll. **Merging deploys the live site within minutes**, so whatever a PR
breaks is broken for every visitor, and for the iOS and Android apps that link here.

What lives here:

- `index.html` and `assets/landing/` (`landing.css`, `landing.js`, images): the landing page. Plain HTML, CSS and
  one small deferred vanilla-JS script: no build step, no framework, and **no front matter**, so Jekyll copies the
  file as-is.
- The legal pages: `privacy.md`, `terms.md`, `terms-general.md`, `terms-pro.md` (Markdown with `layout: legal`,
  rendered by `_layouts/legal.html` at `/privacy/`, `/terms/`, `/terms/general/`, `/terms/pro/`). The apps and the
  store listings link to these URLs.
- `delete-account.html`: the account-deletion page Google Play requires.
- `.well-known/apple-app-site-association` and `.well-known/assetlinks.json`: universal links, app links and
  passkey sign-in for the apps. They are published only because `_config.yml` has `include: [".well-known"]`.
- `CNAME`: the custom domain.
- `.github/`: this reviewer, and the weekly contributors job (`workflows/contributors.yml` and
  `scripts/update_contributors.py`), which rewrites the block between the `contributors:start` /
  `contributors:end` markers in `index.html` and pushes straight to `master`.

**Main branch is `master`.** The harness hands you the pull request's unified diff as a file. The checkout is the
PR head only (`fetch-depth: 1`): there is no `origin/master` ref and no `gh` access inside the review, and
`git log` / `git blame` see only the head commit.

## How to review

1. Read the unified diff the harness wrote for you; its path is in the task prompt. The PR branch is already
   checked out in the working directory.
2. **Do not review the diff in isolation.** For changed markup, open the CSS rules that style it and the
   JavaScript that finds it (`landing.js` looks elements up by class, id and `data-` attribute). For changed CSS,
   find every element it applies to. For changed JavaScript, follow the elements it touches back into
   `index.html`.
3. Check both layouts. The wide rules come first in `landing.css`; the narrow layout is the
   `@media (max-width: 699.98px)` block at the end. Which download block shows is decided by device, not width:
   the inline script in `<head>` adds `is-phone`, `is-android` and `is-ipad` to `<html>`.
4. Comment **only on lines changed by this PR**, in changed files.

## What to skip

- Binary files (images), `package-lock.json`, and anything under `node_modules/`.
- The generated contributors block between the markers in `index.html`, unless the PR changes its generator.
- `.github/claude/reviewer/` internals, unless the PR changes them; then review them as code.
- Do not quote secret material. **But DO flag (as ERROR) any committed secret or credential.**

## What to flag

### 🔴 ERROR — block merge

- **Broken `.well-known` files.** Invalid JSON; a wrong team id, bundle id, package name or SHA-256 certificate
  fingerprint; or `_config.yml` losing `include: [".well-known"]`. Any of these breaks universal links, app links
  and passkey sign-in for every app user.
- **A URL the apps or stores rely on disappears or moves**: `/privacy/`, `/terms/`, `/terms/general/`,
  `/terms/pro/`, `/delete-account.html`, or the domain in `CNAME`.
- **A JavaScript error that stops `landing.js`.** The script is one function; an exception early in it (for example
  querying an element the PR removed or renamed, then calling a method on `null`) leaves the platform menu, the
  store switch and the "Now playing" bar dead.
- **Content that misstates the product**: a paid feature presented as free (cloud sync and uploads need a Lite or
  Pro subscription), a feature the apps don't have, or a wrong store link or app id.
- **Jekyll breakage**: front matter added to `index.html`, or `{{` / `{%` added to a file Jekyll processes, which
  changes how the page builds; a legal page losing its `layout` or `permalink`.
- **Committed secrets or private data**: keys, tokens, or a real person's email or name beyond the public
  App Store reviewer handles and GitHub usernames the page already shows.

### 🟡 WARN — worth a comment, not blocking

- **Layout breakage at common widths**: 320, 360, 375 and 390 px phones; the 700 px boundary; 768 and 1024 px
  tablets; 1440 px desktop. Horizontal scrolling, overflowing content, or content left under the fixed
  "Now playing" bar.
- **Accessibility**: text contrast under 4.5:1 (3:1 for 24 px+ or 18.66 px+ bold); the hero is white text on a
  blue gradient, so check new hero text there. Missing `alt` or accessible names on meaningful images and
  icon-only controls; focus that isn't visible; controls Tab can't reach; ARIA misuse; live regions that announce
  on every scroll.
- **Links**: anchors to ids that don't exist; `http://` links; App Store links pinned to one storefront
  (`/us/app/...`); use `https://apps.apple.com/app/id1138219998` so each visitor gets their own store.
- **Numbers that go stale**: hardcoded counts or ratings with nothing keeping them true. Prefer wording that stays
  true as the number grows ("Over 20,000").
- **Performance**: large images above the fold, images without `width`/`height` (layout shift), images below the
  fold without `loading="lazy"`.
- **Workflows**: actions not pinned to a commit SHA (with the version in a trailing comment); permissions broader
  than the job needs; a scheduled job that commits on every run, which redeploys the site each time.
- Typos and grammar in visible text.

### 🔵 INFO — mention if helpful

- Dead CSS, unused classes, inconsistent naming or formatting, comments that no longer match the code.

## Reporting findings

Your findings are consumed by an automated harness — **do not post comments or create reviews yourself.**
It posts each finding as an inline comment, recognises a finding you reported on an earlier push and leaves
that comment alone, and closes an earlier comment only when a second pass has judged it against the current
code — fixed, no longer applicable, accepted by a maintainer, or a duplicate of something reported on this
push. Nothing closes because you stopped mentioning it. A finding whose line the API will not accept as an
inline anchor, and any finding past the inline cap, is listed in the summary comment rather than lost — but a
finding with no usable line number at all is dropped, so tie every finding to a line this PR changed. The
exact JSON shape to emit is defined by the output contract in your system prompt.

- Report each issue with its severity, file, the **changed line** it applies to, and a concrete fix.
  Tie every finding to a line the PR actually changed.
- In the `summary`, give explicit attention to **`.well-known` and link integrity, product claims, and the phone
  layout and accessibility** when relevant.
- **Confidence bar:** false positives erode trust. When unsure, downgrade the severity or drop the
  finding rather than assert a problem that may not exist.
- This review is advisory — a human still merges. Be direct and concrete; skip praise padding.
