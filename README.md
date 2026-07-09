# jesselumarie.com

Personal website for Jesse Lumarie: a static landing page plus a
[Pelican](https://getpelican.com/)-generated blog, deployed to an S3 bucket
behind CloudFront.

## Repository layout

```
.
├── landing_page/    # Static HTML/CSS for the site root (https://jesselumarie.com)
│   ├── index.html   # Landing page (Bootstrap 3 + jQuery via CDN, Google Analytics)
│   ├── about/       # About page
│   └── *.png/.jpg   # Images and icons
├── blog/            # Pelican blog source (served at https://jesselumarie.com/blog)
│   ├── content/     # Blog posts (Markdown with Pelican metadata headers)
│   ├── pelicanconf.py   # Dev config (SITEURL, theme path, pagination)
│   ├── publishconf.py   # Production config (relative URLs, Atom feeds, deletes output dir)
│   └── Makefile     # Build/serve targets (`make html`, `make serve`, etc.)
├── pelican_theme/   # Custom Pelican theme (derived from the SoMA theme)
│   ├── templates/   # Jinja2 templates
│   └── static/      # Theme CSS/assets
└── circle.yml       # CircleCI (1.0-style) build + deploy config
```

There is no build step for `landing_page/` — its files are deployed as-is.
Only the blog is generated.

## Prerequisites

```sh
pip install pelican markdown
```

Note: the configs date from the Python 2 era (`from __future__` imports) but
build fine under modern Pelican/Python 3 (verified with Pelican 4.x on
Python 3.14).

## Local development

All blog commands run from `blog/`:

```sh
cd blog
make html            # generate the site into blog/output/ using pelicanconf.py
make serve           # serve blog/output/ at http://localhost:8000
make regenerate      # rebuild on file changes
make clean           # remove blog/output/
make publish         # production build using publishconf.py
```

For the landing page, just open `landing_page/index.html` in a browser or
serve the directory with any static file server.

### Writing a blog post

Add a Markdown file to `blog/content/` with a Pelican metadata header:

```markdown
Title: My Post Title
Date: 2026-07-09
Category: Programming
Tags: python,web
Slug: my-post-title
Authors: Jesse Lumarie
Summary: One-line summary shown in the index and feeds.

Post body starts here...
```

The post will be published at `https://jesselumarie.com/blog/<slug>.html`.

## Deployment

Deployment is fully automated via CircleCI (`circle.yml`) and runs **only on
pushes to `master`** — merging a PR to `master` deploys the site. There is no
manual deploy step and no tests (`test` is a no-op echo).

What CI does:

1. Installs `pelican`, `markdown`, and `s3cmd`.
2. Builds the blog with `make html` (from `blog/`).
3. Assembles a deploy directory: `landing_page/*` at the root and
   `blog/output/*` under `blog/`.
4. Syncs to S3 with `aws s3 sync ... s3://jesselumarie.com --delete`
   (**`--delete` removes anything in the bucket not present in the build**).
5. Invalidates the entire CloudFront distribution (`/*`).

Required CI environment variables (set in the CircleCI project, not in the repo):

| Variable | Purpose |
|---|---|
| `S3CFG_ACCESS_KEY` / `S3CFG_SECRET_KEY` | AWS credentials for the S3 sync |
| `AWS_CLOUDFRONT_ID` | CloudFront distribution ID for cache invalidation |

## Gotchas for agents

- **Do not commit generated files.** `blog/output/` is gitignored, but
  `blog/__pycache__/` is not — delete it after local builds.
- `pelicanconf.py` hardcodes the production `SITEURL`; for local preview with
  correct links, uncomment the dev `SITEURL = ''` line (and re-comment before
  committing) or use `RELATIVE_URLS = True`.
- The theme lives at `../pelican_theme` relative to `blog/`, so blog builds
  must run from inside `blog/`.
- Because the S3 sync uses `--delete`, anything served on the live site must
  exist in this repo (under `landing_page/` or generated into `blog/output/`).
- `circle.yml` uses the legacy CircleCI 1.0 format, not the modern
  `.circleci/config.yml` layout.
