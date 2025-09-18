import { PropsWithChildren } from "react";

export default function Placeholder({ children }: PropsWithChildren) {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
        <div className="prose dark:prose-invert">
          {children}
        </div>
      </div>
    </div>
  );
}
