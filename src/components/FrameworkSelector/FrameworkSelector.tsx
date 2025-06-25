"use client";

import { useRouter, useParams } from "next/navigation";

export default function FrameworkSelector() {
  const router = useRouter();
  const { frameworks } = useParams() as { frameworks?: string };
  const currentFramework = frameworks || "nextjs"; // Default to nextjs if missing

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFramework = e.target.value;
    if (selectedFramework !== currentFramework) {
      router.push(`/docs/${selectedFramework}`);
    }
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="framework-select"
        className="block mb-2 text-lg font-medium text-gray-300"
      >
        Select Framework:
      </label>
      <select
        id="framework-select"
        value={currentFramework}
        onChange={handleChange}
        className="p-2 rounded border border-gray-700 bg-gray-900 text-white"
      >
        <option value="react">React</option>
        <option value="nextjs">Next.js</option>
      </select>
    </div>
  );
}
