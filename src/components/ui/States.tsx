import type { ReactNode } from "react";
import type { Resource } from "../../data/useResource";

export function Loading({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      {label}…
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="card tone-bad" role="alert">
      <strong>Something went wrong.</strong> {error.message}
    </div>
  );
}

export function ResourceView<T>({ resource, label, children }: { resource: Resource<T>; label?: string; children: (data: T) => ReactNode }) {
  if (resource.status === "loading") return <Loading label={label} />;
  if (resource.status === "error") return <ErrorState error={resource.error} />;
  return <>{children(resource.data)}</>;
}
