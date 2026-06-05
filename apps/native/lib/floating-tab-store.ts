import { useSyncExternalStore } from "react";

type CellLayout = { x: number; width: number; contentWidth: number };

type State = {
  focused: string | null;
  layouts: Record<string, CellLayout>;
};

let state: State = { focused: null, layouts: {} };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function setLayout(name: string, layout: Partial<CellLayout> | CellLayout) {
  const existing = state.layouts[name];
  const merged: CellLayout = {
    x: layout.x ?? existing?.x ?? 0,
    width: layout.width ?? existing?.width ?? 0,
    contentWidth: layout.contentWidth ?? existing?.contentWidth ?? 0,
  };
  if (
    existing &&
    existing.x === merged.x &&
    existing.width === merged.width &&
    existing.contentWidth === merged.contentWidth
  ) {
    return;
  }
  state = { ...state, layouts: { ...state.layouts, [name]: merged } };
  emit();
}

export function setFocused(name: string | null) {
  if (state.focused === name) {
    return;
  }
  state = { ...state, focused: name };
  emit();
}

/**
 * Drop the store state for a set of tab names. Used when the active
 * tab set changes (e.g. user role switches) so that the active pill
 * doesn't keep pointing at a tab that no longer exists.
 */
export function pruneTabState(names: Iterable<string>) {
  const allowed = new Set(names);
  let layoutsChanged = false;
  const nextLayouts: Record<string, CellLayout> = {};
  for (const [name, layout] of Object.entries(state.layouts)) {
    if (allowed.has(name)) {
      nextLayouts[name] = layout;
    } else {
      layoutsChanged = true;
    }
  }
  const focusedStillValid = state.focused !== null && allowed.has(state.focused);
  if (!layoutsChanged && focusedStillValid) {
    return;
  }
  state = {
    focused: focusedStillValid ? state.focused : null,
    layouts: nextLayouts,
  };
  emit();
}

export function useFloatingTabState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
