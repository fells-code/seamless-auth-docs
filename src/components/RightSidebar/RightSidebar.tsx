"use client";

import Link from "next/link";
import { useTableOfContents } from "@/hooks/useTableOfContents";
import { useActiveSection } from "@/hooks/useActiveSection";

export default function RightSidebar() {
  const toc = useTableOfContents();
  const activeId = useActiveSection(toc.map((item) => item.id));

  if (toc.length === 0) return null;

  return (
    <aside className="w-64 p-6 border-l border-gray-700 bg-background hidden lg:block sticky top-20 h-fit">
      <h2 className="text-2xl font-bold mb-6 text-primary">On this page</h2>

      <ul className="space-y-2 text-gray-400 text-sm">
        {toc.map((item) => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              className={`hover:text-white ${
                activeId === item.id ? "text-white font-semibold" : ""
              }`}
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
