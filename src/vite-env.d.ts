/// <reference types="vite/client" />

interface ImportMeta {
  readonly glob: <T = unknown>(
    pattern: string,
    options?: { eager?: boolean; import?: string },
  ) => Record<string, T>
}
