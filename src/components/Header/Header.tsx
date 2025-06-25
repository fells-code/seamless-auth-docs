"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full p-4 border-b border-gray-700 bg-black text-white flex justify-between items-center">
      <Link
        href="/"
        className="text-2xl font-bold text-primary hover:underline"
      >
        SeamlessAuth Docs
      </Link>
      <nav className="space-x-4 text-sm text-gray-400">
        <Link href="/docs/nextjs" className="hover:text-white">
          Docs
        </Link>
        <Link href="/privacy" className="hover:text-white">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-white">
          Terms
        </Link>
      </nav>
    </header>
  );
}
