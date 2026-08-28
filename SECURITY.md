# Security

This is a static site with no backend, no build step, no dependencies and no user data.
It makes exactly one network request beyond fonts: an unauthenticated `GET` to the
GitHub REST API to read this repository's public star count and last push date.

If you find something anyway — an XSS vector in the generated snippets, a way to make the
clipboard write something unexpected — please report it privately through
[GitHub Security Advisories](https://github.com/oleksand4rux-del/cursor-lab/security/advisories/new)
rather than a public issue.
