import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass rounded-2xl px-6 py-12 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center">
      <h3 className="font-display text-base font-semibold">Could not load this</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {message ?? "Something went wrong. Refresh to try again."}
      </p>
    </div>
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass h-20 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}
