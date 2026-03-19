declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace React {
  type ReactNode = any;
}

declare module 'react' {
  export type ReactNode = any;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
}

declare module 'next' {
  export type Metadata = Record<string, unknown>;
  export type NextConfig = Record<string, unknown>;
}

declare module 'next/link' {
  const Link: (props: any) => any;
  export default Link;
}

declare module 'next/navigation' {
  export function notFound(): never;
}

declare module 'node:fs' {
  export const promises: any;
  export type Dirent = any;
}

declare module 'node:path' {
  const path: any;
  export default path;
}

declare const process: {
  cwd(): string;
};
