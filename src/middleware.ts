import { NextRequest } from "next/server";
import { middlewareRunner } from "./lib/middleware/middleware-runner";
import { implicitAuthMiddleware } from "./lib/middleware/implicit-auth-middleware";
import { cartCookieMiddleware } from "./lib/middleware/cart-cookie-middleware";
import { jamfContextTagMiddleware } from "./lib/middleware/jamf-context-tag-middleware";

export async function middleware(req: NextRequest) {
  return middlewareRunner(
    {
      runnable: implicitAuthMiddleware,
      options: {
        exclude: ["/_next", "/configuration-error"],
      },
    },
    {
      runnable: cartCookieMiddleware,
      options: {
        exclude: ["/_next", "/configuration-error"],
      },
    },
    {
      runnable: jamfContextTagMiddleware,
      options: {
        exclude: ["/_next", "/configuration-error"],
      },
    },
  )(req);
}
