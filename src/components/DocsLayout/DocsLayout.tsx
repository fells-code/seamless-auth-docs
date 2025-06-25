"use client";

import Sidebar from "../Sidebar/Sidebar";
import RightSidebar from "../RightSidebar/RightSidebar";
import { Framework } from "@/types";

type DocsLayoutProps = {
  framework: Framework;
  children: React.ReactNode;
};

export default function DocsLayout({ framework, children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar framework={framework} />
      <main className="flex-1 max-w-4xl mx-auto p-6">{children}</main>
      <RightSidebar />
    </div>
  );
}
