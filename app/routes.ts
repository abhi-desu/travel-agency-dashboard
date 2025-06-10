import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/admin/admin-layout.tsx", [
    route("dashboard", "routes/admin/dashboard.tsx", {
      loader: async () => {
        return null; // or any fake data
      },
    }),
    route("all-users", "routes/admin/all-users.tsx", {
      loader: async () => {
        return null;
      },
    }),
  ]),
] satisfies RouteConfig;
