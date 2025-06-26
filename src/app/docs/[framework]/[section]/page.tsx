// src/app/docs/[framework]/[section]/page.tsx

"use client";

import * as React from "react";
import { motion } from "framer-motion";

import DocsLayout from "@/components/DocsLayout/DocsLayout";
import FrameworkSelector from "@/components/FrameworkSelector/FrameworkSelector";
import sidebarLinks from "@/data/sidebarLinks";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Framework } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FrameworkSectionPage({ params }: { params: any }) {
  const { framework, section } = React.use(params) as {
    framework: Framework;
    section: string;
  };

  const sections = sidebarLinks[framework];
  if (!sections) return notFound();

  const currentIndex = sections.findIndex((item: { href: string }) =>
    item.href.endsWith(`/${section}`)
  );
  if (currentIndex === -1) return notFound();

  const CurrentComponent = sections[currentIndex].component;

  const prev = sections[currentIndex - 1];
  const next = sections[currentIndex + 1];

  return (
    <DocsLayout framework={framework}>
      <div className="mb-8">
        <FrameworkSelector />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <CurrentComponent />
        </motion.div>
      </div>

      {/* Next/Back Navigation */}
      <div className="flex justify-between mt-12 border-t pt-6 border-gray-700">
        {prev ? (
          <Link href={prev.href} className="text-accent hover:underline">
            ← {prev.label}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={next.href} className="text-accent hover:underline">
            {next.label} →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </DocsLayout>
  );
}
