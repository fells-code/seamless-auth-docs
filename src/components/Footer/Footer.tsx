"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full p-4 border-t border-gray-700 bg-black text-center text-sm text-gray-400">
      <nav className="space-x-4 mb-2">
        <Link href="/privacy" className="hover:text-white">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-white">
          Terms of Use
        </Link>
        <Link href="/contact" className="hover:text-white">
          Contact
        </Link>
      </nav>
      <p>
        &copy; {new Date().getFullYear()} SeamlessAuth. All rights reserved.
      </p>
    </footer>
  );
}
