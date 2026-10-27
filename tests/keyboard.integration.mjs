import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// An isolated, signed-out browser session; no existing tasks or accounts are used.
const browser = `todos-keyboard-${process.pid}`;
const run = (...args) => execFileSync('agent-browser', ['--session', browser, ...args], { encoding: 'utf8', timeout: 30000 });
const read = expression => JSON.parse(execFileSync('agent-browser', ['--session', browser, 'eval', '--stdin'], { input: expression, encoding: 'utf8', timeout: 30000 }));
async function until(expression, message) {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (read(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw Error(message);
}
const titles = () => read('[...document.querySelectorAll(".task")].map(row => row.querySelector(".task-title")?.textContent ?? row.querySelector("textarea").value)');
try {
  run('open', 'http://127.0.0.1:5186');
  read('localStorage.setItem("todos:sign-in-offered", "true"); true');
  run('reload');
  await until('document.querySelector(".new-task textarea")?.disabled === false', 'Editor did not become ready');
  if (read('!!document.querySelector("[role=dialog]")')) run('find', 'role', 'button', 'click', '--name', 'Close');
  for (const title of ['Alpha', 'Beta', 'Gamma']) {
    run('find', 'label', 'New task', 'fill', title); run('press', 'Enter');
    assert.equal(read('document.activeElement.getAttribute("aria-label")'), 'New task', 'Enter must keep the next empty bullet focused from the first task onward');
  }
  run('find', 'role', 'button', 'click', '--name', 'Edit Alpha');
  run('find', 'label', 'Task', 'fill', 'Alpha edited', '--exact');
  run('press', 'End'); run('press', 'Enter');
  assert.equal(read('document.activeElement.getAttribute("aria-label")'), 'New task', 'Enter from the first saved todo must continue into a new bullet');
  assert.deepEqual(titles(), ['Alpha edited', 'Beta', 'Gamma']);
  run('find', 'label', 'New task', 'fill', 'Fourth'); run('press', 'Enter');
  assert.deepEqual(titles(), ['Alpha edited', 'Beta', 'Gamma', 'Fourth']);
  run('find', 'role', 'button', 'click', '--name', 'Delete Fourth');
  run('find', 'role', 'button', 'click', '--name', 'Edit Alpha edited');
  run('find', 'label', 'Task', 'fill', 'Alpha', '--exact'); run('press', 'Enter');
  run('find', 'role', 'button', 'click', '--name', 'Edit Beta');
  run('press', 'Meta+a');
  assert.equal(read('document.activeElement.value.slice(document.activeElement.selectionStart, document.activeElement.selectionEnd)'), 'Beta');
  assert.equal(read('document.querySelectorAll(".task.selected").length'), 0);
  run('press', 'Meta+a');
  await until('document.querySelectorAll(".task.selected").length === 3', 'Second Cmd+A did not select all blocks');
  assert.match(read('window.getSelection().toString()'), /Alpha[\s\S]*Beta[\s\S]*Gamma/);
  run('press', 'Escape');
  assert.equal(read('document.querySelectorAll(".task.selected").length'), 0);
  assert.deepEqual(titles(), ['Alpha', 'Beta', 'Gamma']);

  run('find', 'role', 'button', 'click', '--name', 'Edit Beta');
  run('find', 'label', 'Task', 'fill', 'Z', '--exact');
  run('press', 'Backspace');
  assert.equal(read('document.querySelectorAll(".task").length'), 3, 'Removing the last character must not delete the row yet');
  run('press', 'Backspace');
  assert.deepEqual(titles(), ['Alpha', 'Gamma']);
  assert.equal(read('document.activeElement.value'), 'Alpha');
  assert.equal(read('document.activeElement.selectionStart'), 5);
  run('press', 'Meta+z');
  assert.deepEqual(titles(), ['Alpha', 'Beta', 'Gamma'], 'One undo should restore the empty-row deletion');

  run('find', 'label', 'New task', 'fill', '');
  run('press', 'Backspace');
  assert.deepEqual(titles(), ['Alpha', 'Beta', 'Gamma']);
  assert.equal(read('document.activeElement.value'), 'Gamma');
  await until('getComputedStyle(document.querySelector(".new-task")).opacity === "0"', 'Empty draft bullet did not fade away');
  run('press', 'Meta+a'); run('press', 'Meta+a');
  await until('document.querySelectorAll(".task.selected").length === 3', 'All-block selection did not repeat after draft removal');
  run('press', 'Backspace');
  assert.deepEqual(titles(), []);
  run('press', 'Meta+z');
  assert.deepEqual(titles(), ['Alpha', 'Beta', 'Gamma'], 'One undo should restore the whole deleted selection');

  // The native Edit menu dispatches this same action instead of WebKit Select All.
  run('find', 'role', 'button', 'click', '--name', 'Edit Alpha');
  read('window.dispatchEvent(new Event("todos-select-all"))');
  assert.equal(read('document.activeElement.value.slice(document.activeElement.selectionStart, document.activeElement.selectionEnd)'), 'Alpha');
  read('window.dispatchEvent(new Event("todos-select-all"))');
  await until('document.querySelectorAll(".task.selected").length === 3', 'Native menu action did not select all blocks');
  run('press', 'Escape');
  run('reload');
  await until('document.querySelectorAll(".task").length === 3', 'Restored blocks did not survive reload');
  assert.deepEqual(titles(), ['Alpha', 'Beta', 'Gamma']);
  console.log('PASS: Enter from first/new/saved rows, two-stage Cmd+A, native selection action, empty-row Backspace, draft dismissal, previous-row caret, grouped delete/undo, reload persistence');
} finally {
  try { run('close'); } catch { /* The temporary browser may already have closed. */ }
}
