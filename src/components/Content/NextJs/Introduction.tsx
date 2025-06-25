"use client";

export default function NextJsIntroduction() {
  return (
    <section id="introduction">
      <h2 id="introduction" className="text-headline font-extrabold mb-4">
        Next.js Integration
      </h2>

      <p className="text-lg text-gray-300 mb-4">
        SeamlessAuth provides a fully passwordless authentication solution that
        integrates effortlessly with Next.js applications. Our system is
        designed to be fast, secure, and scalable, giving your users a
        frictionless login experience while reducing your security burden.
      </p>

      <p className="text-lg text-gray-300 mb-4">
        With SeamlessAuth, you can quickly add secure authentication to your
        Next.js project using our React SDK and backend utilities for Next.js
        API routes. Whether you&apos;re building a simple SaaS app or a complex
        enterprise solution, SeamlessAuth handles the heavy lifting for you.
      </p>

      <h2 id="why-seamless" className="text-xl font-semibold mb-2 text-accent">
        Why SeamlessAuth for Next.js?
      </h2>
      <ul className="list-disc pl-6 text-gray-400 space-y-2 mb-4">
        <li>No passwords, no phishing vectors, no compromises.</li>
        <li>
          Single-tenant authentication servers for maximum isolation and
          security.
        </li>
        <li>
          Easy to set up with native support for the Next.js App Router and API
          routes.
        </li>
        <li>
          Full React context support via a drop-in <code>AuthProvider</code>.
        </li>
        <li>
          Pre-built support for modern auth technologies like WebAuthn and
          passkeys.
        </li>
      </ul>

      <p className="text-lg text-gray-300">
        This guide will walk you through the entire process, from installing the
        SeamlessAuth packages to configuring your authentication provider and
        securing your API routes.
      </p>
    </section>
  );
}
