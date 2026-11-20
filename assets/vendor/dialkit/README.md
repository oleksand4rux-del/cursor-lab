# DialKit 2.2.1 (vendored)

Copied unmodified from the npm package `dialkit@2.2.1`, MIT, by Josh Puckett.
https://www.dialkit.dev · https://github.com/joshpuckett/dialkit

| File | From the package |
|---|---|
| `dialkit.js` | `dist/vanilla/browser.global.js` |
| `dialkit.css` | `dist/vanilla/styles.css` |
| `LICENSE` | `LICENSE` |

The browser build is an IIFE that defines a global `DialKit`, so it loads with a
plain `<script>` tag. That keeps the site free of a build step and lets
`index.html` still run straight from disk, which an ES module would not.

Tarball integrity, checked against the registry before copying:
`sha512-4PDVfRy4LtOZxr3LHTzJmdIqeonYbqc+/jaUOmll5jYof/alQLdFd5D7DIVSmBgygqsb21nkoYxnmUH5uvKd7A==`

To upgrade: take the same two files from a newer tarball, verify its
integrity the same way, and bump the version here and the `?v=` in `index.html`.
