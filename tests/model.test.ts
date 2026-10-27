import test from "node:test";
import assert from "node:assert/strict";
import { applyOperations, parseCache, type Todo } from "../src/model.ts";

const task: Todo = { id: "one", title: "Original", completed: false, created_at: "2026-10-27T00:00:00Z", deleted_at: null };
test("retrying a create preserves edits made on another device", () => {
  assert.equal(applyOperations([{ ...task, title: "Edited on phone" }], [{ id: "a", kind: "create", task }])[0].title, "Edited on phone");
});
test("offline checkbox change merges with a remote title edit", () => {
  const [merged] = applyOperations([{ ...task, title: "Edited on phone" }], [{ id: "a", kind: "patch", taskId: task.id, patch: { completed: true } }]);
  assert.equal(merged.title, "Edited on phone"); assert.equal(merged.completed, true);
});
test("offline queue preserves create, edit, delete ordering", () => {
  const [merged] = applyOperations([], [{ id: "a", kind: "create", task }, { id: "b", kind: "patch", taskId: task.id, patch: { title: "Renamed" } }, { id: "c", kind: "patch", taskId: task.id, patch: { deleted_at: "2026-10-27T01:00:00Z" } }]);
  assert.equal(merged.title, "Renamed"); assert.ok(merged.deleted_at);
});
test("malformed saved data is rejected without replacing it with empty data", () => {
  assert.throws(() => parseCache('{"tasks":[{}],"pending":[]}'));
  assert.throws(() => parseCache('not json'));
  assert.deepEqual(parseCache(null), { tasks: [], pending: [] });
});
