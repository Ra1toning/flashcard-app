import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/review/:path*",
    "/test/:path*",
    "/deck/create",
    "/deck/:id/edit",
    "/profile/:path*",
  ],
};
