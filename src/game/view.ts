let onScreen = true;

export function setBoardOnScreen(value: boolean) {
  onScreen = value;
}

export function effectsPaused(): boolean {
  return (typeof document !== "undefined" && document.hidden) || !onScreen;
}
