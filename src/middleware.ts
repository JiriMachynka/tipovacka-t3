import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/"
  ]
});

export const config = {
  matcher: [ "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)", "/" ],
};