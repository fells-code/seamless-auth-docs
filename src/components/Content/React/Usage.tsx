"use client";

export default function ReactUsage() {
  return (
    <section>
      <h2 id="usage" className="text-headline font-extrabold mb-4">
        Usage
      </h2>
      <p className="text-lg text-gray-300 mb-4">
        To enable authentication in React, wrap your application with the
        SeamlessAuth <code>AuthProvider</code>.
      </p>
      <pre className="bg-gray-800 p-4 rounded mb-6 text-sm">
        <code>{`import { AuthProvider } from '@seamless-auth/nextjs';

export default function App() {
  return (
    <AuthProvider apiHost="https://your-app.seamlessauth.com">
      {/* Your app components here */}
    </AuthProvider>
  );
}`}</code>
      </pre>
      <p className="text-lg text-gray-300">
        The authentication context is now available throughout your application.
        You can use SeamlessAuth’s hooks to manage user state and authentication
        flows.
      </p>
    </section>
  );
}
