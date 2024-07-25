import {
  HOME_ROUTE,
  KPI_ROUTE
} from "./app/consts.tsx";
import Home from "./pages/HomePage/Home.tsx";
import Kpi from "./pages/KpiPage/Kpi.tsx";
export const PubRoutes = [
  {
    path: HOME_ROUTE,
    Component: Home,
  },
  {
    path: KPI_ROUTE,
    Component: Kpi
  },
];
