"use client";

import { useState, useSyncExternalStore } from "react";

const key = "world-tv:favorites:v1";
const eventName = "world-tv:favorites-changed";
const empty: string[] = [];
let cachedText: string | null = null;
let cachedIds = empty;

function snapshot() {
  try {
    const text = localStorage.getItem(key);
    if (text !== cachedText) {
      cachedText = text;
      const value: unknown = JSON.parse(text ?? "[]");
      cachedIds = Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : empty;
    }
  } catch { /* Private browsing may disable storage; keep session favorites. */ }
  return cachedIds;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(eventName, listener);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, snapshot, () => empty);
  const [error, setError] = useState("");
  function toggle(id: string) {
    const current = snapshot();
    cachedIds = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
    try {
      localStorage.setItem(key, JSON.stringify(cachedIds));
      cachedText = localStorage.getItem(key);
      setError("");
    } catch { setError("Preferiti salvati solo per questa sessione: la memoria del browser non è disponibile."); }
    window.dispatchEvent(new Event(eventName));
  }
  return { ids, toggle, error };
}
