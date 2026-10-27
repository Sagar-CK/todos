import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent, type CSSProperties, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { Palette, X } from "lucide-react";
import { Button, Checkbox, Dialog, GraphicalProvider, Input, Menu, theme, type ColorMode } from "@/components/graphical";
import { addTask, patchTask, startStore, supabase, todoStore, undoLastAction } from "./store";
import type { Todo } from "./model";
import { readAccent, saveAccent, accentInk, shouldOfferSignIn, markSignInOffered } from "./preferences";
import "@/components/graphical/styles.css";
import "./styles.css";

function Account({ close }: { close: () => void }) {
  const { session, pending } = useSyncExternalStore(todoStore.subscribe, todoStore.getSnapshot);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      const result = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.__nativePlatform ? import.meta.env.VITE_AUTH_REDIRECT_URL : location.origin } });
      if (result.error) throw result.error;
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn’t sign in. Retry."); }
    finally { setBusy(false); }
  }
  return <>
    <Dialog.Title>{session ? "Account" : "Sign in"}</Dialog.Title>
    {session ? <>
      <p>{session.user.email}</p>
      {pending.length > 0 && <p>Sync your pending changes before signing out.</p>}
      <div className="dialog-actions"><Dialog.Close render={<Button variant="ghost" />}>Close</Dialog.Close><Button variant="secondary" disabled={pending.length > 0} onClick={async () => { if (!supabase) return; const result = await supabase.auth.signOut({ scope: "local" }); if (result.error) setError(result.error.message); else close(); }}>Sign out</Button></div>
    </> : <form className="account-form" onSubmit={submit}>
      <p className="sign-in-note">Sign in once on each device. Your todos sync automatically.</p>
      <label htmlFor="email">Email</label>
      <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required readOnly={sent} autoFocus />
      {sent && <p role="status">Open the sign-in link in your email on this device.</p>}
      <div className="dialog-actions"><Dialog.Close render={<Button variant="ghost" />}>Close</Dialog.Close>{sent ? <Button variant="ghost" type="button" onClick={() => setSent(false)}>Change email</Button> : <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send sign-in link"}</Button>}</div>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
  </>;
}

function TaskCheckbox({ accented, ...props }: ComponentProps<typeof Checkbox.Root> & { accented: boolean }) {
  return <Checkbox.Root {...props} style={{
    borderRadius: "var(--radius-s)",
    "--control-fill": accented ? "var(--todo-accent)" : "var(--neutral-3)",
    "--control-fill-image": "none",
    "--control-inset-shadow": `inset 0 0 0 var(--border-s) ${accented ? "var(--todo-accent)" : "var(--neutral-6)"}`,
    "--control-ink": accented ? "var(--todo-accent-ink)" : "var(--neutral-10)",
  } as CSSProperties}><Checkbox.Indicator style={{ color: "var(--control-ink)" }} /></Checkbox.Root>;
}

function AccentPicker({ value, change }: { value: string | null; change: (value: string | null) => void }) {
  const { dark } = theme.theme.colors;
  const presets: [string, string][] = [
    ["Blue", dark["color-3"]!], ["Green", dark["color-2"]!],
    ["Purple", dark["color-4"]!], ["Orange", dark.warning!], ["Rose", dark.error!],
  ];
  const swatchStyle: CSSProperties = {
    width: "calc(var(--size-l) + var(--space-xs) * 2)",
    height: "calc(var(--size-l) + var(--space-xs) * 2)",
    padding: "var(--space-xs)", borderRadius: "var(--radius-full)",
  };
  return <>
    <Dialog.Title>Accent color</Dialog.Title>
    <div className="accent-options">
      <Button variant="ghost" aria-label="Default accent" aria-pressed={value === null} className="accent-swatch" style={swatchStyle} onClick={() => change(null)}><span style={{ background: "var(--neutral-7)" }} /></Button>
      {presets.map(([name, color]) => <Button key={name} variant="ghost" aria-label={`${name} accent`} aria-pressed={value === color} className="accent-swatch" style={swatchStyle} onClick={() => change(color)}><span style={{ background: color }} /></Button>)}
      <input className="accent-custom" type="color" aria-label="Custom accent color" title="Custom color" value={value ?? dark["color-3"]} onChange={event => change(event.target.value)} />
    </div>
    <div className="dialog-actions"><Dialog.Close render={<Button variant="ghost" />}>Done</Dialog.Close></div>
  </>;
}

function TaskRow({ task, remove, accented }: { task: Todo; remove: () => void; accented: boolean }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const cancelled = useRef(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { if (editor.current) { editor.current.style.height = "0"; editor.current.style.height = `${editor.current.scrollHeight}px`; } }, [editing, title]);
  function save() {
    if (cancelled.current) return;
    cancelled.current = true;
    const next = title.trim();
    if (next && next !== task.title) patchTask(task.id, { title: next });
    setEditing(false);
  }
  return <li className={`task ${task.completed ? "completed" : ""}`}>
    <TaskCheckbox accented={accented} checked={task.completed} onCheckedChange={checked => patchTask(task.id, { completed: checked === true })} aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`} />
    {editing ? <textarea ref={editor} className="inline-editor" aria-label="Task" value={title} onChange={e => setTitle(e.target.value)} onBlur={save} onKeyDown={e => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save(); }
      if (e.key === "Escape") { e.stopPropagation(); cancelled.current = true; setEditing(false); }
    }} autoFocus maxLength={2000} rows={1} />
      : <button type="button" className="task-title" aria-label={`Edit ${task.title}`} onClick={() => { cancelled.current = false; setTitle(task.title); setEditing(true); }}>{task.title}</button>}
    <div className="task-actions"><Button variant="ghost" aria-label={`Delete ${task.title}`} onClick={remove}><X className="delete-icon" /></Button></div>
  </li>;
}

function App() {
  const state = useSyncExternalStore(todoStore.subscribe, todoStore.getSnapshot);
  const [title, setTitle] = useState("");
  const [account, setAccount] = useState(false);
  const [appearance, setAppearance] = useState(false);
  const [accent, setAccent] = useState(readAccent);
  const changeAccent = (value: string | null) => { saveAccent(value); setAccent(value); };
  useEffect(() => {
    window.webkit?.messageHandlers.todos?.postMessage({ type: "appearance", accent });
  }, [accent]);
  useEffect(() => {
    if (state.session) setAccount(false);
    else if (state.ready && supabase && shouldOfferSignIn()) {
      markSignInOffered(); setAccount(true);
    }
  }, [state.ready, state.session?.user.id]);
  useEffect(() => {
    window.webkit?.messageHandlers.todos?.postMessage({ type: "modal", open: account || appearance });
  }, [account, appearance]);
  useEffect(() => {
    const openAccent = () => setAppearance(true);
    const openAccount = () => { if (supabase) setAccount(true); };
    window.addEventListener("todos-open-accent", openAccent);
    window.addEventListener("todos-open-account", openAccount);
    return () => { window.removeEventListener("todos-open-accent", openAccent); window.removeEventListener("todos-open-account", openAccount); };
  }, []);
  const [hidden, setHidden] = useState(false);
  const [mode, setMode] = useState<ColorMode>(() => matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  useEffect(() => {
    const switchMode = () => setMode(value => value === "dark" ? "light" : "dark");
    window.addEventListener("todos-switch-appearance", switchMode);
    return () => window.removeEventListener("todos-switch-appearance", switchMode);
  }, []);
  const input = useRef<HTMLTextAreaElement>(null);
  const draft = useRef("");
  function saveDraft() {
    const value = draft.current.trim();
    if (value && addTask(value)) { draft.current = ""; setTitle(""); }
  }
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  useLayoutEffect(() => { if (input.current) { input.current.style.height = "0"; input.current.style.height = `${input.current.scrollHeight}px`; } }, [title]);
  useEffect(() => {
    const save = () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      saveDraftRef.current();
    };
    window.addEventListener("todos-save-draft", save);
    const undo = () => {
      const active = document.activeElement;
      if ((active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) && active.value) document.execCommand("undo");
      else undoLastAction();
    };
    window.addEventListener("todos-undo", undo);
    return () => { window.removeEventListener("todos-save-draft", save); window.removeEventListener("todos-undo", undo); };
  }, []);
  const tasks = state.tasks.filter(task => !task.deleted_at);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setMode(query.matches ? "dark" : "light"); query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    let lastTap = 0;
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "n") { event.preventDefault(); input.current?.focus(); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        const active = document.activeElement;
        if (!((active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) && active.value)) { event.preventDefault(); undoLastAction(); }
      }
      if (event.key === "Escape" && !account && !appearance && !document.querySelector('[role="menu"]')) {
        saveDraftRef.current();
        if (window.__nativePlatform === "mac") window.webkit?.messageHandlers.todos?.postMessage({ type: "hide" });
        else if (!window.__nativePlatform) setHidden(true);
      }
      // Browser preview shortcut only outside inputs. Native Mac owns global detection.
      if (!window.__nativePlatform && event.code === "Backquote" && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); const now = performance.now();
        if (lastTap && now - lastTap < 300) { setHidden(value => !value); lastTap = 0; } else lastTap = now;
      } else lastTap = 0;
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [account, appearance]);
  return <GraphicalProvider document={theme} colorMode={mode}>
    <main className={`app ${window.__nativePlatform ? `native native-${window.__nativePlatform}` : "browser"}`} data-accent={accent ? "custom" : "default"} style={accent ? { "--todo-accent": accent, "--todo-accent-ink": accentInk(accent) } as CSSProperties : undefined}>
      {hidden ? <Button variant="ghost" onClick={() => setHidden(false)}>Open todos</Button> : <section className="checklist" aria-label="Todos">
        <h1 className="visually-hidden">Todos</h1>
        {window.__nativePlatform !== "mac" && <div className="toolbar"><Menu.Root><Menu.Trigger render={<Button variant="ghost" aria-label="Options" />}><Palette /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end"><Menu.Popup>
          <Menu.Item disabled={!supabase} onClick={() => setAccount(true)}>Account</Menu.Item>
          <Menu.Item onClick={() => setAppearance(true)}>Accent color</Menu.Item>
          <Menu.Item onClick={() => setMode(mode === "dark" ? "light" : "dark")}>{mode === "dark" ? "Light appearance" : "Dark appearance"}</Menu.Item>

        </Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div>}
        <div className="task-list">
          <ul>{tasks.map(task => <TaskRow key={task.id} task={task} accented={Boolean(accent)} remove={() => patchTask(task.id, { deleted_at: new Date().toISOString() })} />)}</ul>
          <div className="draft-zone" onClick={() => input.current?.focus()}>
            <div className={`new-task ${title ? "has-draft" : ""}`}>
              <span className="draft-checkbox" aria-hidden="true"><TaskCheckbox accented={Boolean(accent)} disabled tabIndex={-1} /></span>
              <textarea ref={input} className="inline-editor" aria-label="New task" value={title} onChange={e => { draft.current = e.target.value; setTitle(e.target.value); }} onBlur={saveDraft} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); saveDraft(); } }} maxLength={2000} disabled={!state.ready} rows={1} />
            </div>
          </div>
        </div>
        {state.error && <div className="sync-error" role="alert"><span>{state.error}</span></div>}
      </section>}
      <Dialog.Root open={appearance} onOpenChange={setAppearance}><Dialog.Portal><Dialog.Backdrop /><Dialog.Popup className="accent-dialog"><AccentPicker value={accent} change={changeAccent} /></Dialog.Popup></Dialog.Portal></Dialog.Root>
      <Dialog.Root open={account} onOpenChange={setAccount}><Dialog.Portal><Dialog.Backdrop /><Dialog.Popup className="account-dialog"><Account close={() => setAccount(false)} /></Dialog.Popup></Dialog.Portal></Dialog.Root>
    </main>
  </GraphicalProvider>;
}

createRoot(document.getElementById("root")!).render(<App />);
void startStore();
