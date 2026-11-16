// The per-repository half of the sandbox. Everything else in this directory is portable; this file and
// `../review-guide.md` are the two that change when the harness is copied to another repository. A copy that
// keeps these lists gets rules that match nothing of its own and no rule naming its secret files — so review
// both when you port.

// Files in the checkout that hold credentials even though they are gitignored. This repository is a static
// GitHub Pages site and has none: nothing is built from secrets, and the `.well-known/` files (app site
// association, asset links) are public by design. The generic path rules (`.env`, keys, and the like) still apply.
export const REPO_SECRET_FILES = [];

// Secret SHAPES this repository's content can contain, applied by `redact` after the generic ones (Anthropic
// keys, GitHub tokens, PEM private keys). None beyond those: the site carries no API keys, connection strings or
// client ids. Add an entry (with its `example` and `keeps` look-alike, which the harness's test runs) if that
// ever changes.
export const REPO_SECRET_SHAPES = [];
