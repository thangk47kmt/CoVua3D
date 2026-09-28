import { createMiddleware } from "@tanstack/react-start";

/**
 * Hall identity: a real social session when one exists, otherwise a name-only
 * guest whose id was created by `enterAsGuest` and stored on this device.
 */
export const hallAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("./auth/client");
    const { readGuest } = await import("./hall-identity");
    return next({
      sendContext: {
        bearerToken: getBearerToken() ?? undefined,
        guestId: readGuest()?.userId,
      },
    });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("./auth/isolation.server");
    const { UnauthorizedError, getSessionUser } = await import("./auth/verify.server");
    assertSameSiteRequest();
    const session = await getSessionUser(context.bearerToken);
    if (session?.id) return next({ context: { userId: session.id } });

    const guestId = typeof context.guestId === "string" ? context.guestId : "";
    if (/^guest_[a-f0-9]{24}$/.test(guestId)) {
      const { getSql } = await import("./db");
      const sql = await getSql();
      const rows = await sql<{ user_id: string }>`
        select user_id from profiles where user_id = ${guestId} limit 1
      `;
      if (rows[0]) return next({ context: { userId: guestId } });
    }
    throw new UnauthorizedError();
  });
