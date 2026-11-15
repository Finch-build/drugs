import { useEffect, useState } from "react";

export type Resource<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T };

export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    loader().then(
      (data) => alive && setState({ status: "ready", data }),
      (error: Error) => alive && setState({ status: "error", error }),
    );
    return () => {
      alive = false;
    };
  }, deps);
  return state;
}
