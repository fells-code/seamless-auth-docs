"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import sidebarLinks from "../../data/sidebarLinks";
import { Framework } from "@/types";

type SidebarProps = {
  framework: Framework;
};

export default function Sidebar({ framework }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 p-6 border-r border-gray-700 bg-black">
      <h2 className="text-2xl font-bold mb-6 text-primary">Docs</h2>
      {}
      {sidebarLinks[framework]?.map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            className={`py-2 px-3 rounded cursor-pointer mb-2 ${
              pathname === item.href
                ? "bg-primary text-white"
                : "hover:bg-gray-800"
            }`}
          >
            {item.label}
          </div>
        </Link>
      ))}
    </aside>
  );
}
