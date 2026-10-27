/// <reference types="vite/client" />
interface Window {
  __demo?: boolean;
  webkit?: { messageHandlers: { todos?: { postMessage: (body: unknown) => void } } };
  __nativeSession?: { access_token: string; refresh_token: string };
  __nativePlatform?: "mac" | "ios";
  __shortcutState?: "enabled" | "disabled" | "permission-required" | "unavailable";
}
