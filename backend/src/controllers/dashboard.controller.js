import * as dashboardService from "../services/dashboard.service.js";

export async function index(req, res) {
  const data = await dashboardService.getDashboardKpis(req.user);
  res.json(data);
}
