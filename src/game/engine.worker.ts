import { search, type EngineMove } from "./engine";

type Request = {
  id: number;
  fen: string;
  movetime: number;
  noise: number;
  depthCap: number;
};

type Reply = { id: number; move: EngineMove | null; error?: string };

addEventListener("message", (event: MessageEvent<Request>) => {
  const { id, fen, movetime, noise, depthCap } = event.data;
  try {
    const move = search(fen, movetime, noise, depthCap);
    postMessage({ id, move } satisfies Reply);
  } catch (error) {
    postMessage({ id, move: null, error: error instanceof Error ? error.message : "search failed" } satisfies Reply);
  }
});
