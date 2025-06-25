"use client";

export default function ReactInstallation() {
  return (
    <section>
      <h2 id="react-installation" className="text-headline font-extrabold mb-4">
        Installation
      </h2>
      <p className="text-lg text-gray-300 mb-4">
        Install the SeamlessAuth React package using pnpm:
      </p>
      <pre className="bg-gray-800 p-4 rounded mb-6 text-sm">
        <code>pnpm add @seamless-auth/nextjs</code>
      </pre>
      <p className="text-lg text-gray-300">
        You will need your SeamlessAuth API host from the dashboard to complete
        your setup.
      </p>
    </section>
  );
}
