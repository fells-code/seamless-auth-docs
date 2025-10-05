import { useEffect, useMemo, useState } from "react";
import FlexSearch, { Index } from "flexsearch";
import { DOCS } from "../content";
import { useNavigate } from "react-router-dom";

export default function Search() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ slug: string; title: string }[]>([]);

  const index = useMemo(() => {
    const idx = new (FlexSearch as any).Index({ tokenize: "forward" }) as Index;
    DOCS.forEach((d) => idx.add(d.slug, `${d.title} ${d.tags.join(" ")}`));
    return idx;
  }, []);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    const ids = (index.search(q) as string[]).slice(0, 8);
    setResults(
      ids.map((slug) => ({
        slug,
        title: DOCS.find((d) => d.slug === slug)!.title,
      }))
    );
  }, [q, index]);

  return (
    <div className="search">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search docs…"
        aria-label="Search"
      />
      {!!results.length && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.slug}>
              <button onClick={() => nav(`/docs/${r.slug}`)}>{r.title}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
