import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Maintenance mode
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  if (isMaintenanceMode) {
    const pathname = req.nextUrl.pathname;
    const isExcluded =
      pathname.startsWith("/maintenance") || pathname.startsWith("/_next/");
    if (!isExcluded) {
      return NextResponse.rewrite(new URL("/maintenance", req.url));
    }
  }

});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
