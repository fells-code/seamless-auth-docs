"use client";

export default function NextJsUsage() {
  return (
    <section>
      <h2 id="nextjs-usage" className="text-headline font-extrabold mb-4">
        Usage
      </h2>
      <p className="text-lg text-gray-300 mb-4">
        To enable authentication, wrap your application with the SeamlessAuth{" "}
        <code>AuthProvider</code>.
      </p>
      <pre className="bg-gray-800 p-4 rounded mb-6 text-sm">
        <code>{`import { AuthProvider } from '@seamless-auth/nextjs';

export default function App({ children }) {
  return (
    <AuthProvider apiHost="https://your-app.seamlessauth.com">
      {children}
    </AuthProvider>
  );
}`}</code>
      </pre>
      <p className="text-lg text-gray-300">
        You can now access the authentication context throughout your app using
        SeamlessAuth’s built-in hooks.
      </p>
    </section>
  );
}
