import { useEffect, useState } from "react";

export default function Toc() {
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll(".doc h2, .doc h3")
    ) as HTMLHeadingElement[];
    setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent || "" })));
  }, []);

  if (!headings.length) return null;

  return (
    <nav className="toc">
      <div className="toc-title">On this page</div>
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
