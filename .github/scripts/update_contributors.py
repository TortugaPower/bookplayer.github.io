#!/usr/bin/env python3
"""Refresh the contributors card on the landing page.

Reads TortugaPower/BookPlayer's contributors from the GitHub API (people only, bots skipped,
most contributions first), saves the top avatars into assets/landing/contributors/, and rewrites
the block between the contributors markers in index.html.

Run every week by .github/workflows/contributors.yml. To run it locally:
    GH_TOKEN=$(gh auth token) python3 .github/scripts/update_contributors.py
"""
import html
import json
import os
import pathlib
import urllib.request

REPO = "TortugaPower/BookPlayer"
WIDE = 14    # avatars shown on wide screens
NARROW = 8   # avatars shown on phones; must match `.avatars .avatar:nth-child(n+9)` in landing.css
ROOT = pathlib.Path(__file__).resolve().parents[2]
AVATARS = ROOT / "assets/landing/contributors"
PAGE = ROOT / "index.html"
START = "<!-- contributors:start -->"
END = "<!-- contributors:end -->"
EXTENSIONS = {"image/png": "png", "image/jpeg": "jpg", "image/gif": "gif"}


def fetch(url):
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json"})
    token = os.environ.get("GH_TOKEN")
    if token and url.startswith("https://api.github.com/"):
        request.add_header("Authorization", f"Bearer {token}")
    return urllib.request.urlopen(request, timeout=30)


def contributors():
    people, page = [], 1
    while True:
        with fetch(f"https://api.github.com/repos/{REPO}/contributors?per_page=100&page={page}") as response:
            batch = json.load(response)
        people += [person for person in batch if person["type"] == "User"]
        if len(batch) < 100:
            return people
        page += 1


def save_avatar(person):
    """Save a 96px avatar (2x the 46px it's shown at) and return its file name."""
    with fetch(person["avatar_url"] + "&s=96") as response:
        name = f'{person["login"]}.{EXTENSIONS[response.headers.get_content_type()]}'
        (AVATARS / name).write_bytes(response.read())
    return name


def card(total, top):
    rows = []
    for person, avatar in top:
        login = html.escape(person["login"])
        rows.append(
            f'            <li class="avatar"><a href="https://github.com/{login}" aria-label="{login} on GitHub" title="{login}">'
            f'<img src="/assets/landing/contributors/{avatar}" alt="" width="46" height="46" loading="lazy"></a></li>'
        )
    rows.append(
        f'            <li><a class="more" href="https://github.com/{REPO}/graphs/contributors" aria-label="See all {total} contributors on GitHub">'
        f'<span class="wide-only">+{total - WIDE}</span><span class="narrow-only">+{total - NARROW}</span></a></li>'
    )
    return "\n".join([
        '        <div class="card contrib">',
        '          <div class="contrib-text">',
        f'            <h3>Made by {total} contributors</h3>',
        '            <p>Fix a bug, translate the app or suggest a feature on GitHub.</p>',
        '          </div>',
        f'          <!-- Top contributors; narrow screens show the first {NARROW} -->',
        '          <ul class="avatars">',
        *rows,
        '          </ul>',
        '        </div>',
    ])


def main():
    people = contributors()
    top = [(person, save_avatar(person)) for person in people[:WIDE]]

    # Remove avatars of people who are no longer in the top list.
    keep = {avatar for _, avatar in top}
    for file in AVATARS.iterdir():
        if file.name not in keep:
            file.unlink()

    page = PAGE.read_text()
    before, rest = page.split(START, 1)
    _, after = rest.split(END, 1)
    PAGE.write_text(f"{before}{START}\n{card(len(people), top)}\n        {END}{after}")
    print(f"{len(people)} contributors; top {WIDE}: {', '.join(person['login'] for person, _ in top)}")


if __name__ == "__main__":
    main()
