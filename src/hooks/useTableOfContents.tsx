import { useEffect, useState } from "react";

export type Heading = {
  id: string;
  text: string;
};

export function useTableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const contentHeadings = Array.from(document.querySelectorAll("h2"))
      .map((heading) => ({
        id: heading.id,
        text: heading.textContent || "",
      }))
      .filter((heading) => heading.id); // Filter out any headings without ids

    setHeadings(contentHeadings);
  }, []);

  return headings;
}
