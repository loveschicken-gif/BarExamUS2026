declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
  }
}

declare module 'next/link' {
  import { ComponentType, ReactNode } from 'react';

  export interface LinkProps {
    href: string;
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }

  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function notFound(): never;
}

declare module 'react' {
  export type Key = string | number;
  export type ReactNode = unknown;
  export interface Attributes {
    key?: Key;
  }
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type ComponentType<P = Record<string, unknown>> = (props: P) => JSX.Element;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
}

declare namespace JSX {
  interface Element {}
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes {
    key?: string | number;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
