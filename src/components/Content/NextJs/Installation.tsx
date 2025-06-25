"use client";

export default function NextJsInstallation() {
  return (
    <section>
      <h2
        id="nextjs-installation"
        className="text-headline font-extrabold mb-4"
      >
        Installation
      </h2>
      <p className="text-lg text-gray-300 mb-4">
        Start by creating a new Next.js project if you don&apos;t have one:
      </p>
      <pre className="bg-gray-800 p-4 rounded mb-6 text-sm">
        <code>
          npx create-next-app@latest seamlessauth-app --ts --tailwind --app
          --eslint
        </code>
      </pre>
      <p className="text-lg text-gray-300 mb-4">
        Then install the SeamlessAuth packages using pnpm:
      </p>
      <pre className="bg-gray-800 p-4 rounded mb-6 text-sm">
        <code>pnpm add @seamless-auth/nextjs @seamless-auth/nextjs-server</code>
      </pre>
      <p className="text-lg text-gray-300">
        You’ll also need your SeamlessAuth API host from the dashboard to
        complete the configuration.
      </p>
    </section>
  );
}
