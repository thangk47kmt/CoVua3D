import { createFileRoute } from "@tanstack/react-router";
import { OnlineMatch } from "@/components/game/OnlineMatch";
import { HallGate } from "@/components/hall/HallGate";
import { useHallIdentity } from "@/components/hall/use-hall-identity";
import { useT } from "@/i18n";

export const Route = createFileRoute("/match/$id")({
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const ident = useHallIdentity();
  const { t } = useT();
  if (!ident.ready) {
    return <div className="grid h-dvh place-items-center text-muted">{t("openingMatch")}</div>;
  }
  if (!ident.present) return <HallGate callback={`/match/${id}`} onEntered={ident.reload} />;
  return <OnlineMatch id={id} />;
}
