import { useEffect, useState } from 'react'

export const REPO = { owner: 'oleksand4rux-del', name: 'cursor-lab' }
export const REPO_URL = `https://github.com/${REPO.owner}/${REPO.name}`

type Meta = { stars: number | null; updated: Date }

const KEY = `cl.gh.${REPO.owner}.${REPO.name}`
const TTL = 3600e3

/* Live star count and the date of the last push. Cached for an hour so a
   reload does not spend the 60/hour anonymous quota; offline or rate-limited,
   the build date stands and the count simply stays hidden. */
export function useGitHub(): Meta {
  const [meta, setMeta] = useState<Meta>(() => {
    const fallback: Meta = { stars: null, updated: new Date(__BUILD_TIME__) }
    try {
      const hit = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (hit && Date.now() - hit.t < TTL) return { stars: hit.n, updated: hit.p ? new Date(hit.p) : fallback.updated }
    } catch { /* storage blocked: fetch instead */ }
    return fallback
  })

  useEffect(() => {
    if (meta.stars !== null) return
    const ctrl = new AbortController()
    fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || typeof d.stargazers_count !== 'number') return
        setMeta({ stars: d.stargazers_count, updated: d.pushed_at ? new Date(d.pushed_at) : meta.updated })
        try { localStorage.setItem(KEY, JSON.stringify({ n: d.stargazers_count, p: d.pushed_at, t: Date.now() })) } catch { /* fine */ }
      })
      .catch(() => { /* offline or rate-limited */ })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return meta
}

/* ISO date: unambiguous and sorts */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const shortCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n))
