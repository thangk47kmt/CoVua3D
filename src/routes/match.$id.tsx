import { createFileRoute } from "@tanstack/react-router";
import { OnlineMatch } from "@/components/game/OnlineMatch";
import { HallGate } from "@/components/hall/HallGate";
import { useHallIdentity } from "@/components/hall/use-hall-identity";

export const Route = createFileRoute("/match/$id")({
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const ident = useHallIdentity();
  if (!ident.ready) {
    return <div className="grid h-dvh place-items-center text-muted">Đang mở ván đấu…</div>;
  }
  if (!ident.present) return <HallGate callback={`/match/${id}`} onEntered={ident.reload} />;
  return <OnlineMatch id={id} />;
}
