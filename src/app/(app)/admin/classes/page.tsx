import { Suspense } from "react";
import ClassesAdminInner from "./ClassesAdminInner";

export default function AdminClassesPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-secondary">Loading classes…</p>
      }
    >
      <ClassesAdminInner />
    </Suspense>
  );
}
