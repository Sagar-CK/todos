import { createClient, type Session, type RealtimeChannel } from "@supabase/supabase-js";
import { applyOperations, parseCache, type Cache, type Todo, type Patch, type Operation } from "./model";

export const supabase = !window.__demo && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY) : null;
type Snapshot = Cache & { session: Session | null; error: string | null; syncing: boolean; ready: boolean };
let state: Snapshot = { tasks: [], pending: [], session: null, error: null, syncing: false, ready: false };
let owner = "local";
let generation = 0;
let channel: RealtimeChannel | undefined;
let activeSync: Promise<void> | undefined;
const listeners = new Set<() => void>();
const key = (id = owner) => `sagar-todos:v1:${id}`;
const undoStack: { taskId: string; patch: Patch }[] = [];

function emit(patch: Partial<Snapshot>) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn());
  if (state.ready) window.webkit?.messageHandlers.todos?.postMessage({ type: "tasks", tasks: state.tasks, userId: state.session?.user.id ?? null });
}
function save(cache: Cache) {
  try {
    localStorage.setItem(key(), JSON.stringify(cache));
    emit(cache);
    return true;
  } catch {
    emit({ error: "Couldn’t save on this device. Free up storage and retry." });
    return false;
  }
}
export const todoStore = { subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }, getSnapshot: () => state };

export function mutate(operation: Operation, recordUndo = true) {
  if (!state.ready) return false;
  let inverse: { taskId: string; patch: Patch } | undefined;
  if (recordUndo) {
    if (operation.kind === "create") inverse = { taskId: operation.task.id, patch: { deleted_at: new Date().toISOString() } };
    else {
      const task = state.tasks.find(task => task.id === operation.taskId);
      if (task) {
        const patch: Patch = {};
        if ("title" in operation.patch) patch.title = task.title;
        if ("completed" in operation.patch) patch.completed = task.completed;
        if ("deleted_at" in operation.patch) patch.deleted_at = task.deleted_at;
        inverse = { taskId: task.id, patch };
      }
    }
  }
  const pending = [...state.pending, operation];
  const saved = save({ tasks: applyOperations(state.tasks, [operation]), pending });
  if (saved && inverse) { undoStack.push(inverse); if (undoStack.length > 100) undoStack.shift(); }
  if (saved) void synchronize();
  return saved;
}
export function addTask(title: string) {
  title = title.trim();
  if (!title || title.length > 2000) return false;
  const task: Todo = { id: crypto.randomUUID(), title, completed: false, created_at: new Date().toISOString(), deleted_at: null };
  return mutate({ id: crypto.randomUUID(), kind: "create", task });
}
export function patchTask(taskId: string, patch: Patch) {
  mutate({ id: crypto.randomUUID(), kind: "patch", taskId, patch });
}
export function undoLastAction() {
  const previous = undoStack.at(-1);
  if (previous && mutate({ id: crypto.randomUUID(), kind: "patch", taskId: previous.taskId, patch: previous.patch }, false)) undoStack.pop();
}

export async function synchronize(): Promise<void> {
  const client = supabase;
  if (!client) return;
  if (activeSync) return activeSync;
  if (!state.session || !state.ready) return;
  if (!navigator.onLine) { emit({ error: "Offline. Changes will sync when you reconnect." }); return; }
  const currentGeneration = generation;
  const userId = state.session.user.id;
  const run = async () => {
    emit({ syncing: true });
    try {
      while (state.pending.length && generation === currentGeneration) {
        const operation = state.pending[0];
        const result = operation.kind === "create"
          ? await client.from("todos").upsert({ ...operation.task, user_id: userId }, { onConflict: "id", ignoreDuplicates: true })
          : await client.from("todos").update(operation.patch).eq("id", operation.taskId).eq("user_id", userId);
        if (result.error) throw result.error;
        if (generation !== currentGeneration) return;
        if (!save({ tasks: state.tasks, pending: state.pending.filter(item => item.id !== operation.id) })) return;
      }
      const { data, error } = await client.from("todos").select("id,title,completed,created_at,deleted_at").order("created_at").order("id");
      if (error) throw error;
      if (generation !== currentGeneration) return;
      if (save({ tasks: applyOperations(data as Todo[], state.pending), pending: state.pending })) emit({ error: null });
    } catch {
      if (generation === currentGeneration) emit({ error: "Couldn’t sync. Your changes are saved on this device." });
    } finally {
      if (generation === currentGeneration) emit({ syncing: false });
    }
  };
  activeSync = run();
  await activeSync;
  activeSync = undefined;
  if (generation !== currentGeneration) void synchronize();
}

async function changeSession(session: Session | null) {
  const nextOwner = session?.user.id ?? "local";
  window.__nativeSession = session ? { access_token: session.access_token, refresh_token: session.refresh_token } : undefined;
  window.webkit?.messageHandlers.todos?.postMessage({ type: "session", session });
  if (nextOwner === owner && state.ready) { emit({ session }); return; }
  generation++;
  undoStack.length = 0;
  if (channel) { void supabase?.removeChannel(channel); channel = undefined; }
  owner = nextOwner;
  emit({ tasks: [], pending: [], session, ready: false, error: null, syncing: false });
  try {
    let cache = parseCache(localStorage.getItem(key()));
    if (session) {
      const local = parseCache(localStorage.getItem(key("local")));
      if (local.tasks.length) {
        const imports: Operation[] = local.tasks.filter(task => !task.deleted_at).map(task => ({ id: crypto.randomUUID(), kind: "create", task }));
        cache = { tasks: applyOperations(cache.tasks, imports), pending: [...cache.pending, ...imports] };
        localStorage.setItem(key(), JSON.stringify(cache));
        localStorage.removeItem(key("local"));
      }
    }
    emit({ ...cache, ready: true });
  } catch {
    emit({ error: "Couldn’t read saved tasks. Export your data before resetting storage." });
    return;
  }
  if (session && supabase) {
    channel = supabase.channel(`todos:${owner}`).on("postgres_changes", { event: "*", schema: "public", table: "todos", filter: `user_id=eq.${owner}` }, () => { void synchronize(); }).subscribe();
    void synchronize();
  }
}

export async function startStore() {
  if (!supabase) { await changeSession(null); return; }
  const client = supabase;
  supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => { void changeSession(session); }, 0); });
  window.addEventListener("todos-auth", async () => {
    if (window.__nativeSession?.access_token && window.__nativeSession?.refresh_token) {
      const { error } = await client.auth.setSession(window.__nativeSession);
      if (error) emit({ error: "Sign-in link expired. Request a new link." });
    }
  });
  window.addEventListener("todos-native-error", event => emit({ error: (event as CustomEvent<string>).detail }));
  if (window.__nativeSession?.access_token && window.__nativeSession?.refresh_token) {
    await client.auth.setSession(window.__nativeSession);
  }
  const { data } = await supabase.auth.getSession();
  await changeSession(data.session);
  window.addEventListener("online", () => { void synchronize(); });
  window.addEventListener("focus", () => { void synchronize(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void synchronize(); });
  window.addEventListener("todos-resume", async () => {
    if (window.__nativeSession?.access_token && window.__nativeSession?.refresh_token) await client.auth.setSession(window.__nativeSession);
    void synchronize();
  });
  // Also reconcile after reconnects, missed realtime messages, and widget writes.
  setInterval(() => { if (window.__nativePlatform || !document.hidden) void synchronize(); }, 15000);
}
