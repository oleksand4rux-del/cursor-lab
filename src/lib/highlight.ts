/* A tokenizer small enough to keep: comments, strings, keywords, numbers and
   calls. The snippets are short and generated, so a full grammar (shiki,
   which beUI's code block pulls in with the AI SDK) would only add weight. */
const KW = 'const|let|var|function|return|if|else|for|of|in|new|class|export|default|import|from|null|undefined|true|false|typeof|while|continue|break|delete|await|async|this'
const RE = new RegExp(
  '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)' +
  '|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)' +
  '|(\\b(?:' + KW + ')\\b)' +
  '|(\\b\\d+(?:\\.\\d+)?(?:px|s|ms|deg|%|em|rem)?\\b)' +
  '|([A-Za-z_$][\\w$]*)(?=\\()', 'g')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlight(src: string) {
  return esc(src).replace(RE, (m, c, s, k, n, f) => {
    if (c) return '<span class="tok-com">' + c + '</span>'
    if (s) return '<span class="tok-str">' + s + '</span>'
    if (k) return '<span class="tok-key">' + k + '</span>'
    if (n) return '<span class="tok-num">' + n + '</span>'
    if (f) return '<span class="tok-fn">' + f + '</span>'
    return m
  })
}

export async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through to the textarea route */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  ta.remove()
  return ok
}
