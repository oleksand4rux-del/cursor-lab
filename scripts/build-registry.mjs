/* Builds a shadcn registry from the cursor databases, so any cursor installs
   with one command, by a person or an agent:

     npx shadcn@latest add https://cursor-lab-ui.vercel.app/r/dot-ring.json

   The databases and the code generators are loaded through Vite's SSR loader,
   which resolves the "@/" alias and TypeScript the same way the site does.
   Output goes to public/r (one item per cursor, plus registry.json) and
   public/llms.txt. Items carry the default tuning; the site's source view
   carries whatever the visitor tuned. */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const SITE = 'https://cursor-lab-ui.vercel.app'
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = ROOT + 'public/r/'

/* the databases are classic scripts that write to window */
globalThis.window = globalThis

const vite = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const { ANIMATED, DESIGN } = await vite.ssrLoadModule('/src/cursors/index.ts')
const { codeOf, paramsOf } = await vite.ssrLoadModule('/src/lib/catalog.ts')
const { defaults } = await vite.ssrLoadModule('/src/lib/dial.ts')
await vite.close()

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const install = (id) => `npx shadcn@latest add ${SITE}/r/${id}.json`
const exportName = (src) => (src.match(/export function (\w+)/) || [])[1] || null

const items = []
for (const e of [...ANIMATED, ...DESIGN]) {
  const code = codeOf(e, defaults(paramsOf(e)))
  if (!code.react) continue
  const dir = 'components/cursors/'
  const css = e.kind === 'animated' ? code.css : null
  const tsx = "'use client'\n\n" + (css ? `import './${e.id}.css'\n` : '') + code.react.trimStart() + '\n'

  const files = [{ path: dir + e.id + '.tsx', type: 'registry:component', target: dir + e.id + '.tsx', content: tsx }]
  if (css) files.push({ path: dir + e.id + '.css', type: 'registry:file', target: dir + e.id + '.css', content: css + '\n' })

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: e.id,
    type: 'registry:component',
    title: e.name,
    description: e.desc || `${e.name}, a drawn cursor from Cursor Lab`,
    categories: ['cursor', e.kind, e.group.toLowerCase()],
    files,
  }
  writeFileSync(OUT + e.id + '.json', JSON.stringify(item, null, 2))
  items.push({ ...item, files: files.map(({ path, type, target }) => ({ path, type, ...(target ? { target } : {}) })), component: exportName(code.react) })
}

writeFileSync(OUT + 'registry.json', JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'cursor-lab',
  homepage: SITE,
  items: items.map(({ component, ...rest }) => rest),
}, null, 2))

/* the same list for agents, in llms.txt form */
const lines = [
  '# Cursor Lab',
  '',
  `> ${items.length} custom web cursors, drawn and animated. Each installs as a React component with one shadcn command.`,
  '',
  `Registry index: ${SITE}/r/registry.json`,
  'Install: npx shadcn@latest add <item url>. Files land in components/cursors/.',
  'Animated cursors are client components; render one anywhere inside the page. Drawn cursors wrap the area that shows them.',
  '',
  '## Cursors',
  '',
  ...items.map((i) => `- [${i.title}](${SITE}/r/${i.name}.json): ${i.description} Component: \`${i.component}\`. Install: \`${install(i.name)}\``),
  '',
]
writeFileSync(ROOT + 'public/llms.txt', lines.join('\n'))

console.log(`registry: ${items.length} items → public/r, llms.txt`)
