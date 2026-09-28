import { createFileRoute } from "@tanstack/react-router";
import { HallGate } from "@/components/hall/HallGate";
import { HallView } from "@/components/hall/HallView";
import { useHallIdentity } from "@/components/hall/use-hall-identity";

export const Route = createFileRoute("/hall")({
  component: HallPage,
});

function HallPage() {
  const ident = useHallIdentity();
  if (!ident.ready) {
    return <div className="grid h-dvh place-items-center text-muted">Đang mở sảnh…</div>;
  }
  if (!ident.present) return <HallGate callback="/hall" onEntered={ident.reload} />;
  return <HallView />;
}
