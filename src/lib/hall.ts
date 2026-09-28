import { createServerFn } from "@tanstack/react-start";
import { Chess } from "chess.js";
import { getSql } from "@/lib/db";
import { hallAuth } from "@/lib/hall-auth";
import { asSquare, outcome } from "@/game/rules";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export type OnlinePlayer = {
  userId: string;
  displayName: string;
  relation: "friend" | "outgoing" | "incoming" | "none";
};

export type FriendRow = {
  userId: string;
  displayName: string;
  online: boolean;
  friendshipId: string;
  status: string;
  incoming: boolean;
};

export type ChallengeRow = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  fromColor: string;
  gameId: string | null;
  status: string;
  incoming: boolean;
};

export type GameSummary = {
  id: string;
  whiteName: string;
  blackName: string;
  whiteId: string;
  blackId: string;
  status: string;
  result: string | null;
  reason: string | null;
  fen: string;
  updatedAt: string;
};

export type HallSnapshot = {
  profile: { displayName: string; friendCode: string };
  online: OnlinePlayer[];
  friends: FriendRow[];
  challenges: ChallengeRow[];
  myGames: GameSummary[];
  liveGames: GameSummary[];
};

export type GameMove = { ply: number; san: string; fen: string };

export type GameView = {
  id: string;
  whiteId: string;
  blackId: string;
  whiteName: string;
  blackName: string;
  fen: string;
  pgn: string;
  status: string;
  result: string | null;
  reason: string | null;
  drawOffer: string | null;
  youAre: "w" | "b" | "spectator";
  moves: GameMove[];
};

export type ActionResult = { ok: true; gameId?: string } | { ok: false; error: string };

function cleanName(name: string | undefined): string {
  const trimmed = (name ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 24);
  return trimmed || "Khách tinh tú";
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

async function ensureProfile(userId: string, suggested?: string) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string; display_name: string; friend_code: string }>`
    select user_id, display_name, friend_code from profiles where user_id = ${userId}
  `;
  if (existing[0]) {
    await sql`update profiles set last_seen = now() where user_id = ${userId}`;
    return existing[0];
  }
  const displayName = cleanName(suggested);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeCode();
    try {
      const inserted = await sql<{ user_id: string; display_name: string; friend_code: string }>`
        insert into profiles (user_id, display_name, friend_code)
        values (${userId}, ${displayName}, ${code})
        returning user_id, display_name, friend_code
      `;
      if (inserted[0]) return inserted[0];
    } catch {
      const again = await sql<{ user_id: string; display_name: string; friend_code: string }>`
        select user_id, display_name, friend_code from profiles where user_id = ${userId}
      `;
      if (again[0]) return again[0];
    }
  }
  throw new Error("Không tạo được hồ sơ sảnh");
}

export const enterAsGuest = createServerFn({ method: "POST" })
  .validator((input: { displayName?: string } | undefined) => {
    const trimmed = (input?.displayName ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 24);
    if (trimmed.length < 2) throw new Error("Tên cần ít nhất 2 ký tự.");
    return { displayName: trimmed };
  })
  .handler(async ({ data }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const userId = `guest_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    const profile = await ensureProfile(userId, data.displayName);
    return { userId: profile.user_id, displayName: profile.display_name };
  });

function mapGame(row: {
  id: string;
  white_id: string;
  black_id: string;
  white_name: string;
  black_name: string;
  status: string;
  result: string | null;
  reason: string | null;
  fen: string;
  updated_at: string;
}): GameSummary {
  return {
    id: row.id,
    whiteId: row.white_id,
    blackId: row.black_id,
    whiteName: row.white_name,
    blackName: row.black_name,
    status: row.status,
    result: row.result,
    reason: row.reason,
    fen: row.fen,
    updatedAt: row.updated_at,
  };
}

export const syncHall = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { displayName?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }): Promise<HallSnapshot> => {
    const profile = await ensureProfile(context.userId, data.displayName);
    const sql = await getSql();
    await sql`
      update challenges set status = 'expired'
      where status = 'pending'
        and created_at < now() - interval '1 day'
        and (from_id = ${context.userId} or to_id = ${context.userId})
    `;

    const online = await sql<{ user_id: string; display_name: string; status: string | null; requester_id: string | null }>`
      select p.user_id, p.display_name, f.status, f.requester_id
      from profiles p
      left join friendships f on (
        (f.requester_id = ${context.userId} and f.addressee_id = p.user_id)
        or (f.addressee_id = ${context.userId} and f.requester_id = p.user_id)
      )
      where p.user_id <> ${context.userId}
        and p.last_seen > now() - interval '25 seconds'
      order by p.display_name
      limit 40
    `;

    const friends = await sql<{
      user_id: string;
      display_name: string;
      online: boolean;
      friendship_id: string;
      status: string;
      requester_id: string;
    }>`
      select p.user_id, p.display_name,
             (p.last_seen > now() - interval '25 seconds') as online,
             f.id as friendship_id, f.status, f.requester_id
      from friendships f
      join profiles p on p.user_id = case
        when f.requester_id = ${context.userId} then f.addressee_id
        else f.requester_id
      end
      where (f.requester_id = ${context.userId} or f.addressee_id = ${context.userId})
        and f.status <> 'declined'
      order by f.status, p.display_name
    `;

    const challenges = await sql<{
      id: string;
      from_id: string;
      to_id: string;
      from_name: string;
      to_name: string;
      from_color: string;
      game_id: string | null;
      status: string;
    }>`
      select c.id, c.from_id, c.to_id, pf.display_name as from_name, pt.display_name as to_name,
             c.from_color, c.game_id, c.status
      from challenges c
      join profiles pf on pf.user_id = c.from_id
      join profiles pt on pt.user_id = c.to_id
      where (c.from_id = ${context.userId} or c.to_id = ${context.userId})
        and c.status in ('pending', 'accepted')
        and c.created_at > now() - interval '2 hours'
      order by c.created_at desc
      limit 20
    `;

    const myGames = await sql<{
      id: string;
      white_id: string;
      black_id: string;
      white_name: string;
      black_name: string;
      status: string;
      result: string | null;
      reason: string | null;
      fen: string;
      updated_at: string;
    }>`
      select id, white_id, black_id, white_name, black_name, status, result, reason, fen, updated_at::text
      from games
      where white_id = ${context.userId} or black_id = ${context.userId}
      order by updated_at desc
      limit 12
    `;

    const liveGames = await sql<{
      id: string;
      white_id: string;
      black_id: string;
      white_name: string;
      black_name: string;
      status: string;
      result: string | null;
      reason: string | null;
      fen: string;
      updated_at: string;
    }>`
      select id, white_id, black_id, white_name, black_name, status, result, reason, fen, updated_at::text
      from games
      where status = 'playing' and watchable = true
        and white_id <> ${context.userId} and black_id <> ${context.userId}
      order by updated_at desc
      limit 20
    `;

    return {
      profile: { displayName: profile.display_name, friendCode: profile.friend_code },
      online: online.map((row) => {
        let relation: OnlinePlayer["relation"] = "none";
        if (row.status === "accepted") relation = "friend";
        else if (row.status === "pending" && row.requester_id === context.userId) relation = "outgoing";
        else if (row.status === "pending") relation = "incoming";
        return { userId: row.user_id, displayName: row.display_name, relation };
      }),
      friends: friends.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        online: Boolean(row.online),
        friendshipId: row.friendship_id,
        status: row.status,
        incoming: row.status === "pending" && row.requester_id !== context.userId,
      })),
      challenges: challenges.map((row) => ({
        id: row.id,
        fromId: row.from_id,
        toId: row.to_id,
        fromName: row.from_name,
        toName: row.to_name,
        fromColor: row.from_color,
        gameId: row.game_id,
        status: row.status,
        incoming: row.to_id === context.userId,
      })),
      myGames: myGames.map(mapGame),
      liveGames: liveGames.map(mapGame),
    };
  });

export const renameProfile = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((name: string) => cleanName(name))
  .handler(async ({ context, data }): Promise<ActionResult> => {
    await ensureProfile(context.userId, data);
    const sql = await getSql();
    await sql`update profiles set display_name = ${data} where user_id = ${context.userId}`;
    return { ok: true };
  });

export const addFriend = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
  .handler(async ({ context, data }): Promise<ActionResult> => {
    if (data.length < 4) return { ok: false, error: "Mã bạn bè không đúng." };
    await ensureProfile(context.userId);
    const sql = await getSql();
    const found = await sql<{ user_id: string }>`
      select user_id from profiles where friend_code = ${data}
    `;
    const other = found[0]?.user_id;
    if (!other) return { ok: false, error: "Không thấy tinh tú nào mang mã này." };
    if (other === context.userId) return { ok: false, error: "Đây là mã của bạn." };
    const existing = await sql<{ id: string; status: string }>`
      select id, status from friendships
      where (requester_id = ${context.userId} and addressee_id = ${other})
         or (requester_id = ${other} and addressee_id = ${context.userId})
    `;
    if (existing[0]?.status === "accepted") return { ok: false, error: "Hai bạn đã là bạn bè." };
    if (existing[0]) return { ok: false, error: "Lời mời đang chờ trả lời." };
    try {
      await sql`
        insert into friendships (id, requester_id, addressee_id, status)
        values (${crypto.randomUUID()}, ${context.userId}, ${other}, 'pending')
      `;
    } catch {
      return { ok: false, error: "Không gửi được lời mời." };
    }
    return { ok: true };
  });

export const respondFriend = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { friendshipId: string; accept: boolean }) => {
    if (!input?.friendshipId) throw new Error("Thiếu lời mời");
    return { friendshipId: input.friendshipId, accept: Boolean(input.accept) };
  })
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    const status = data.accept ? "accepted" : "declined";
    const rows = await sql<{ id: string }>`
      update friendships set status = ${status}
      where id = ${data.friendshipId} and addressee_id = ${context.userId} and status = 'pending'
      returning id
    `;
    if (!rows[0]) return { ok: false, error: "Lời mời không còn." };
    return { ok: true };
  });

export const challengePlayer = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { toId: string; color: "white" | "black" | "random" }) => {
    if (!input?.toId || input.toId.length > 80) throw new Error("Người chơi không hợp lệ");
    const color = input.color === "white" || input.color === "black" ? input.color : "random";
    return { toId: input.toId, color };
  })
  .handler(async ({ context, data }): Promise<ActionResult> => {
    if (data.toId === context.userId) return { ok: false, error: "Không thể thách đấu chính mình." };
    await ensureProfile(context.userId);
    const sql = await getSql();
    const target = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${data.toId}`;
    if (!target[0]) return { ok: false, error: "Người chơi chưa có trong sảnh." };
    const pending = await sql<{ id: string }>`
      select id from challenges
      where status = 'pending'
        and ((from_id = ${context.userId} and to_id = ${data.toId})
          or (from_id = ${data.toId} and to_id = ${context.userId}))
    `;
    if (pending[0]) return { ok: false, error: "Đã có lời thách đấu đang chờ." };
    const busy = await sql<{ id: string }>`
      select id from games
      where status = 'playing'
        and ((white_id = ${context.userId} and black_id = ${data.toId})
          or (white_id = ${data.toId} and black_id = ${context.userId}))
    `;
    if (busy[0]) return { ok: false, error: "Hai bạn đang có một ván chưa xong." };
    await sql`
      insert into challenges (id, from_id, to_id, from_color, status)
      values (${crypto.randomUUID()}, ${context.userId}, ${data.toId}, ${data.color}, 'pending')
    `;
    return { ok: true };
  });

export const cancelChallenge = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((id: string) => id)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      update challenges set status = 'cancelled'
      where id = ${data} and from_id = ${context.userId} and status = 'pending'
      returning id
    `;
    if (!rows[0]) return { ok: false, error: "Không hủy được lời thách đấu." };
    return { ok: true };
  });

export const answerChallenge = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { challengeId: string; accept: boolean }) => {
    if (!input?.challengeId) throw new Error("Thiếu lời thách đấu");
    return { challengeId: input.challengeId, accept: Boolean(input.accept) };
  })
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    if (!data.accept) {
      const rows = await sql<{ id: string }>`
        update challenges set status = 'declined'
        where id = ${data.challengeId} and to_id = ${context.userId} and status = 'pending'
        returning id
      `;
      if (!rows[0]) return { ok: false, error: "Lời thách đấu không còn." };
      return { ok: true };
    }
    const gameId = crypto.randomUUID();
    const wantWhite = Math.random() < 0.5;
    const created = await sql<{ id: string }>`
      with upd as (
        update challenges
        set status = 'accepted', game_id = ${gameId}
        where id = ${data.challengeId} and to_id = ${context.userId} and status = 'pending'
        returning from_id, to_id, from_color
      ),
      named as (
        select u.from_id, u.to_id, u.from_color, pf.display_name as from_name, pt.display_name as to_name
        from upd u
        join profiles pf on pf.user_id = u.from_id
        join profiles pt on pt.user_id = u.to_id
      )
      insert into games (id, white_id, black_id, white_name, black_name, fen, pgn, status, watchable)
      select
        ${gameId},
        case
          when n.from_color = 'white' then n.from_id
          when n.from_color = 'black' then n.to_id
          when ${wantWhite} then n.from_id
          else n.to_id
        end,
        case
          when n.from_color = 'white' then n.to_id
          when n.from_color = 'black' then n.from_id
          when ${wantWhite} then n.to_id
          else n.from_id
        end,
        case
          when n.from_color = 'white' then n.from_name
          when n.from_color = 'black' then n.to_name
          when ${wantWhite} then n.from_name
          else n.to_name
        end,
        case
          when n.from_color = 'white' then n.to_name
          when n.from_color = 'black' then n.from_name
          when ${wantWhite} then n.to_name
          else n.from_name
        end,
        ${START_FEN},
        '',
        'playing',
        true
      from named n
      returning id
    `;
    if (!created[0]) return { ok: false, error: "Lời thách đấu không còn." };
    return { ok: true, gameId };
  });

async function loadPlayable(gameId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    white_id: string;
    black_id: string;
    fen: string;
    status: string;
  }>`
    select id, white_id, black_id, fen, status from games where id = ${gameId}
  `;
  const game = rows[0];
  if (!game || game.status !== "playing") return { sql, game: null as null, error: "Ván đấu không còn diễn ra." };
  if (game.white_id !== userId && game.black_id !== userId) {
    return { sql, game: null as null, error: "Bạn không phải người chơi ván này." };
  }
  return { sql, game, error: null as string | null };
}

export const playMove = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { gameId: string; from: string; to: string; promotion?: string }) => {
    const square = /^[a-h][1-8]$/;
    if (!input?.gameId || !square.test(input.from ?? "") || !square.test(input.to ?? "")) {
      throw new Error("Nước đi không hợp lệ");
    }
    if (input.promotion && !["q", "r", "b", "n"].includes(input.promotion)) {
      throw new Error("Quân phong cấp không hợp lệ");
    }
    return {
      gameId: input.gameId,
      from: input.from,
      to: input.to,
      promotion: input.promotion,
    };
  })
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const { sql, game, error } = await loadPlayable(data.gameId, context.userId);
    if (!game) return { ok: false, error: error ?? "Không đi được." };
    const chess = new Chess(game.fen);
    const turn = chess.turn();
    const mine = game.white_id === context.userId ? "w" : "b";
    if (mine !== turn) return { ok: false, error: "Chưa đến lượt bạn." };
    const choices = chess.moves({ square: asSquare(data.from), verbose: true }).filter((move) => move.to === data.to);
    if (choices.length === 0) return { ok: false, error: "Nước đi không hợp lệ." };
    if (choices.some((move) => move.promotion) && !data.promotion) {
      return { ok: false, error: "Hãy chọn quân để phong cấp." };
    }
    let played;
    try {
      played = chess.move({ from: asSquare(data.from), to: asSquare(data.to), promotion: data.promotion });
    } catch {
      return { ok: false, error: "Nước đi không hợp lệ." };
    }
    const end = outcome(chess);
    const updated = await sql<{ id: string }>`
      with upd as (
        update games
        set fen = ${chess.fen()},
            pgn = ${chess.pgn()},
            status = ${end.status},
            result = ${end.result},
            reason = ${end.reason},
            draw_offer = null,
            updated_at = now()
        where id = ${game.id} and fen = ${game.fen} and status = 'playing'
          and ((${turn} = 'w' and white_id = ${context.userId}) or (${turn} = 'b' and black_id = ${context.userId}))
        returning id
      )
      insert into game_moves (game_id, ply, san, fen, by_id)
      select id, ${chess.history().length}, ${played.san}, ${chess.fen()}, ${context.userId} from upd
      returning game_id as id
    `;
    if (!updated[0]) return { ok: false, error: "Đối thủ vừa đi. Hãy xem lại bàn cờ." };
    return { ok: true };
  });

export const resignGame = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((gameId: string) => gameId)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    const rows = await sql<{ white_id: string }>`
      update games
      set status = 'finished',
          result = case when white_id = ${context.userId} then '0-1' else '1-0' end,
          reason = 'resign',
          updated_at = now()
      where id = ${data} and status = 'playing' and (white_id = ${context.userId} or black_id = ${context.userId})
      returning white_id
    `;
    if (!rows[0]) return { ok: false, error: "Không xin thua được." };
    return { ok: true };
  });

export const offerDraw = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((gameId: string) => gameId)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      update games set draw_offer = ${context.userId}, updated_at = now()
      where id = ${data} and status = 'playing'
        and (white_id = ${context.userId} or black_id = ${context.userId})
        and (draw_offer is null or draw_offer = ${context.userId})
      returning id
    `;
    if (!rows[0]) return { ok: false, error: "Không gửi được lời hòa." };
    return { ok: true };
  });

export const answerDraw = createServerFn({ method: "POST" })
  .middleware([hallAuth])
  .validator((input: { gameId: string; accept: boolean }) => {
    if (!input?.gameId) throw new Error("Thiếu ván đấu");
    return { gameId: input.gameId, accept: Boolean(input.accept) };
  })
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const sql = await getSql();
    if (!data.accept) {
      const rows = await sql<{ id: string }>`
        update games set draw_offer = null, updated_at = now()
        where id = ${data.gameId} and status = 'playing'
          and draw_offer is not null and draw_offer <> ${context.userId}
          and (white_id = ${context.userId} or black_id = ${context.userId})
        returning id
      `;
      if (!rows[0]) return { ok: false, error: "Không còn lời hòa." };
      return { ok: true };
    }
    const rows = await sql<{ id: string }>`
      update games
      set status = 'finished', result = '1/2-1/2', reason = 'draw', draw_offer = null, updated_at = now()
      where id = ${data.gameId} and status = 'playing'
        and draw_offer is not null and draw_offer <> ${context.userId}
        and (white_id = ${context.userId} or black_id = ${context.userId})
      returning id
    `;
    if (!rows[0]) return { ok: false, error: "Không nhận hòa được." };
    return { ok: true };
  });

export const getGame = createServerFn({ method: "GET" })
  .middleware([hallAuth])
  .validator((id: string) => id)
  .handler(async ({ context, data }): Promise<GameView | null> => {
    const sql = await getSql();
    await sql`update profiles set last_seen = now() where user_id = ${context.userId}`;
    const rows = await sql<{
      id: string;
      white_id: string;
      black_id: string;
      white_name: string;
      black_name: string;
      fen: string;
      pgn: string;
      status: string;
      result: string | null;
      reason: string | null;
      draw_offer: string | null;
      watchable: boolean;
    }>`
      select id, white_id, black_id, white_name, black_name, fen, pgn, status, result, reason, draw_offer, watchable
      from games where id = ${data}
    `;
    const game = rows[0];
    if (!game) return null;
    const player = game.white_id === context.userId || game.black_id === context.userId;
    if (!player && !game.watchable) return null;
    const moves = await sql<GameMove>`
      select ply, san, fen from game_moves where game_id = ${data} order by ply
    `;
    const youAre = game.white_id === context.userId ? "w" : game.black_id === context.userId ? "b" : "spectator";
    return {
      id: game.id,
      whiteId: game.white_id,
      blackId: game.black_id,
      whiteName: game.white_name,
      blackName: game.black_name,
      fen: game.fen,
      pgn: game.pgn,
      status: game.status,
      result: game.result,
      reason: game.reason,
      drawOffer: game.draw_offer,
      youAre,
      moves,
    };
  });
