export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  deleted_at: string | null;
};
export type Patch = Partial<Pick<Todo, "title" | "completed" | "deleted_at">>;
export type Operation =
  | { id: string; kind: "create"; task: Todo }
  | { id: string; kind: "patch"; taskId: string; patch: Patch };
export type Cache = { tasks: Todo[]; pending: Operation[] };

export function applyOperations(tasks: Todo[], operations: Operation[]): Todo[] {
  const byId = new Map(tasks.map(task => [task.id, { ...task }]));
  for (const operation of operations) {
    if (operation.kind === "create") {
      // A retried insert must not overwrite another device's later edit.
      if (!byId.has(operation.task.id)) byId.set(operation.task.id, { ...operation.task });
    } else {
      const task = byId.get(operation.taskId);
      if (task) byId.set(task.id, { ...task, ...operation.patch });
    }
  }
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

export function parseCache(value: string | null): Cache {
  if (!value) return { tasks: [], pending: [] };
  const parsed = JSON.parse(value);
  if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.pending)) throw new Error("Invalid saved tasks");
  for (const task of parsed.tasks) {
    if (typeof task.id !== "string" || typeof task.title !== "string" || typeof task.completed !== "boolean" || typeof task.created_at !== "string" || (task.deleted_at !== null && typeof task.deleted_at !== "string")) throw new Error("Invalid saved task");
  }
  for (const operation of parsed.pending) {
    if (!operation || typeof operation.id !== "string" || !["create", "patch"].includes(operation.kind)) throw new Error("Invalid pending change");
    if (operation.kind === "create" && !operation.task?.id) throw new Error("Invalid pending task");
    if (operation.kind === "patch" && (typeof operation.taskId !== "string" || !operation.patch)) throw new Error("Invalid pending edit");
  }
  return parsed as Cache;
}
