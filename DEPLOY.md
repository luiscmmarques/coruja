# Deploying coruja

Static output on Cloudflare Pages, deployed from GitHub. Merges to `main` go live; every other branch gets a preview URL. This file is the runbook and the reasoning.

## The flow

```
branch push  ->  GitHub Actions ci  ->  Cloudflare Pages preview  <branch>.coruja.pages.dev
merge to main -> GitHub Actions ci  ->  Cloudflare Pages production  coruja.app
```

Previews are native Cloudflare Pages behaviour, not something we build: with the Git integration, every push to a non-production branch deploys to `<branch>.<project>.pages.dev` and every PR gets its preview link as a comment. Production deploys only from `main`.

## One-time setup

### 1. GitHub repository

```sh
brew install gh && gh auth login
gh repo create coruja --private --source . --push
```

Private first; one `gh repo edit --visibility public` flips it when ready. Then governance, so `main` only moves through a green gate:

```sh
gh api -X PUT repos/{owner}/coruja/branches/main/protection \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=verify' \
  -F 'enforce_admins=true' \
  -F 'allow_force_pushes=false' -F 'allow_deletions=false' \
  -F 'required_pull_request_reviews=null' -F 'restrictions=null'
```

### The flow, day to day

`main` is protected and never pushed to directly, including by you. All work rides a
branch named for what it is, and merges through a pull request once CI is green:

```sh
git switch -c feature/reading-goals   # or fix/scanner-torch
# ... work, commit freely ...
git push -u origin feature/reading-goals
# open the PR on GitHub; Cloudflare Pages comments a preview URL on it
# CI (verify) must pass; then Squash and merge
```

- `feature/<name>` for new behaviour, `fix/<name>` for repairs. Nothing else.
- **Squash and merge**, always: main stays a clean line of releases, one commit per
  feature, and the branch's work-in-progress commits stay on the branch.
- Every push to the branch redeploys its preview at `<branch>.coruja.pages.dev`;
  merging to `main` is the production release. Delete the branch after merging.
- The single birth commit is public history now: never amend or force-push again.
  Corrections are new commits on a `fix/` branch.

No required reviews: a household project with one maintainer would deadlock on itself. The gate is the CI run (`verify` in `.github/workflows/ci.yml`), force pushes and branch deletion are blocked, and the rule binds admins too.

### 2. Domain (not yet registered)

Register `coruja.app` at Cloudflare Registrar: at-cost pricing, WHOIS privacy by default, and the registrar and DNS host being the same party removes a whole class of transfer/hijack coordination attacks.

`.app` is a security feature in itself: Google runs the TLD and the **entire zone is HSTS-preloaded** — every browser refuses plain HTTP for any `.app` domain before the first visit. No preload submission, no downgrade window.

### 3. DNS security checklist

| Setting | Value | Why |
| --- | --- | --- |
| DNSSEC | **On** (one click, Cloudflare DNS) | Signed answers; forged-response cache poisoning dies here. |
| CAA | `0 issue "letsencrypt.org"` + `0 issue "pki.goog"` + `0 issuewild ";"` | Pages provisions certs via Let's Encrypt and Google Trust Services; every other CA is refused issuance, and wildcards are refused outright. |
| SPF (TXT) | `v=spf1 include:_spf.mx.cloudflare.net -all` once Email Routing is on; `v=spf1 -all` until then | The domain can receive but never send; `-all` means nobody can forge mail "from" coruja.app. |
| DMARC (TXT) | `v=DMARC1; p=reject; adkim=s; aspf=s` | Rejects everything SPF/DKIM cannot vouch for. |
| MX | Cloudflare Email Routing (for `hi@`; `hi+openlibrary@` and `hi+security@` are subaddresses of it) | Aliases forward; no mailbox to defend. Verify subaddressing delivers `hi+security@` (security.txt names it), Graftful's does. |
| Proxy status | Proxied (orange cloud) | Origin is Pages anyway; keeps the edge in front. |

### 4. Cloudflare Pages project (dashboard, once)

Workers & Pages -> Create -> Pages -> Connect to Git -> the repo.

| Field                  | Value             |
| ---------------------- | ----------------- |
| Production branch      | `main`            |
| Build command          | `npm run build`   |
| Build output directory | `build`           |
| Environment variable   | `NODE_VERSION=22` |

Then Custom domains -> add `coruja.app`, and a Bulk Redirect `www.coruja.app` -> `https://coruja.app` (301). TLS: Full (strict); minimum TLS 1.2.

Caching -> Browser Cache TTL: **Respect Existing Headers**. The `_headers` file is
the whole caching design: `no-cache` HTML shells so deploys take effect immediately,
`immutable` hashed assets so nothing is refetched. A global TTL here would override
both directions and either pin stale shells or re-download immutable files.

**Do not enable Cloudflare Web Analytics.** Its beacon is blocked by our CSP by design, and the privacy page promises no analytics. Edge request counts in the dashboard cost nothing and betray nobody.

Bot Fight Mode is fine: `_headers` already sets `no-transform` on HTML, which keeps email-obfuscation and similar rewrites off our markup.

## What already ships in the repo

- `_headers`: immutable caching for hashed assets, `no-cache` + `no-transform` HTML, guarded by `headers.test.ts`.
- CSP in the built HTML pins `connect-src` to Open Library, its covers host, and the Internet Archive origins the covers redirect to. Nothing else can be reached.
- `.github/workflows/ci.yml`: prettier, svelte-check, tests, build — the merge gate.

## Releases

"Merge to main = release" is the whole ceremony: Pages keeps every deployment immutable and rollback is one click on a previous deployment. If tagged GitHub Releases become worth having, cut them from `main` after the fact; nothing in the deploy path depends on tags.
