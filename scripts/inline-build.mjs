import { readFile, writeFile } from 'node:fs/promises';
// The same real app runs offline in WKWebView, without a development server.
let html = await readFile('dist/index.html', 'utf8');
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile('dist/' + match[1].replace(/^\.\//, ''), 'utf8');
  html = html.replace(match[0], () => '<script type="module">' + js.replace(/<\/script/gi, '<\\/script') + '</script>');
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  const css = await readFile('dist/' + match[1].replace(/^\.\//, ''), 'utf8');
  html = html.replace(match[0], () => '<style>' + css + '</style>');
}
await writeFile('dist/native.html', html);
