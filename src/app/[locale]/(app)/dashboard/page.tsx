"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Truck, Baby, Heart, UserCheck, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  type PieLabelRenderProps,
} from "recharts";

const CHART_COLORS = ["#0d7c5f", "#2da882", "#f59e0b", "#e11d48", "#6366f1", "#0891b2"];

interface StatsData {
  summary: {
    totalPatients: number;
    totalCaravans: number;
    totalChildren: number;
    avgAge: number;
    avgChildren: number;
    withCin: number;
    withoutCin: number;
  };
  ageDistribution: { range: string; count: number }[];
  childrenDistribution: { children: string; count: number }[];
  recentPatients: {
    name: string;
    age: number | null;
    cin: string | null;
    children: number | null;
  }[];
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats || !stats.summary) return null;

  const cinData = [
    { name: "Avec CIN", value: stats.summary.withCin },
    { name: "Sans CIN", value: stats.summary.withoutCin },
  ];

  const cinPercent =
    stats.summary.totalPatients > 0
      ? Math.round(
          (stats.summary.withCin / stats.summary.totalPatients) * 100
        )
      : 0;

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de l&apos;activite de l&apos;association
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t("totalPatients")}
          value={stats.summary.totalPatients}
          icon={Users}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title={t("totalCaravans")}
          value={stats.summary.totalCaravans}
          icon={Truck}
          accent="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Enfants"
          value={stats.summary.totalChildren}
          icon={Baby}
          description="Total enfants"
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Age moyen"
          value={`${stats.summary.avgAge} ans`}
          icon={Heart}
          accent="bg-rose-50 text-rose-500"
        />
        <StatCard
          title="Moy. enfants"
          value={stats.summary.avgChildren}
          icon={Activity}
          description="Par beneficiaire"
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Avec CIN"
          value={`${cinPercent}%`}
          icon={UserCheck}
          description={`${stats.summary.withCin}/${stats.summary.totalPatients}`}
          accent="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Distribution par age
          </h3>
          <p className="text-[12px] text-muted-foreground mb-6">
            Repartition des beneficiaires par tranche d&apos;age
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.ageDistribution} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="range"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5f7a6e" }}
              />
              <YAxis
                allowDecimals={false}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5f7a6e" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #dfe8e3",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="count"
                fill="#0d7c5f"
                radius={[8, 8, 0, 0]}
                name="Beneficiaires"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Children Distribution */}
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Enfants par beneficiaire
          </h3>
          <p className="text-[12px] text-muted-foreground mb-6">
            Nombre d&apos;enfants declares par beneficiaire
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.childrenDistribution} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="children"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5f7a6e" }}
              />
              <YAxis
                allowDecimals={false}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5f7a6e" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #dfe8e3",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="count"
                fill="#2da882"
                radius={[8, 8, 0, 0]}
                name="Beneficiaires"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* CIN Pie */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-white p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Couverture CIN
          </h3>
          <p className="text-[12px] text-muted-foreground mb-4">
            Taux d&apos;identification nationale
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={cinData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ""}: ${props.value}`
                }
              >
                <Cell fill="#0d7c5f" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #dfe8e3",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Patients Table */}
        <div className="lg:col-span-3 rounded-2xl border border-border/60 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground">
              Derniers beneficiaires
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              5 derniers enregistrements
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {(stats.recentPatients || []).length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun beneficiaire enregistre
                </p>
              </div>
            ) : (
              stats.recentPatients.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
                      {(p.name || "?")[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground" dir="auto">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground" dir="ltr">
                        {p.cin || "Pas de CIN"}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-[13px] font-medium">{p.age ?? "-"} ans</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.children != null ? `${p.children} enfants` : "-"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
