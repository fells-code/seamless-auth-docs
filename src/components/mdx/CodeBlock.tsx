import { useState } from 'react'

export function CodeBlock(props) {
  const [copied, setCopied] = useState(false)

  const code =
    typeof props.children === 'string' ? props.children : props.children?.props?.children || ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  return (
    <div className="codeblock-wrapper">
      <button className="copy-btn" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>

      <pre {...props} />
    </div>
  )
}
