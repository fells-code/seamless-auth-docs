export function Image({ src, alt, caption }: { src: string; alt?: string; caption?: string }) {
  return (
    <figure className="doc-image">
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
