const accentKey = "todos:accent";
export function accentInk(hex: string): string {
  const linear = [1, 3, 5].map(offset => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
export function readAccent(): string | null {
  try {
    const value = localStorage.getItem(accentKey);
    return value && /^#[\da-f]{6}$/i.test(value) ? value : null;
  } catch { return null; }
}
export function saveAccent(value: string | null) {
  if (value !== null && !/^#[\da-f]{6}$/i.test(value)) return;
  try {
    if (value) localStorage.setItem(accentKey, value);
    else localStorage.removeItem(accentKey);
  } catch { /* The current session can still preview the color. */ }
}
export function shouldOfferSignIn() {
  try { return localStorage.getItem("todos:sign-in-offered") !== "true"; }
  catch { return true; }
}
export function markSignInOffered() {
  try { localStorage.setItem("todos:sign-in-offered", "true"); }
  catch { /* Storage restrictions must not prevent opening the app. */ }
}
