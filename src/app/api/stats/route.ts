import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const emptyStats = {
  summary: {
    totalPatients: 0,
    totalCaravans: 0,
    totalChildren: 0,
    avgAge: 0,
    avgChildren: 0,
    withCin: 0,
    withoutCin: 0,
  },
  ageDistribution: [],
  childrenDistribution: [],
  caravanStats: [],
  recentPatients: [],
};

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(emptyStats);
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [
      { data: patients },
      { data: caravans },
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("id, first_name, last_name, age, cin, number_of_children, youngest_child_age, is_child, created_at"),
      supabase
        .from("caravans")
        .select("id, name, location, date_start, status")
        .order("date_start", { ascending: false }),
    ]);

    const allPatients = patients || [];
    const allCaravans = caravans || [];

    // Summary
    const totalPatients = allPatients.length;
    const totalCaravans = allCaravans.length;
    const totalChildren = allPatients.reduce(
      (sum, p) => sum + (p.number_of_children || 0),
      0
    );
    const patientsWithAge = allPatients.filter((p) => p.age != null);
    const avgAge =
      patientsWithAge.length > 0
        ? Math.round(
            patientsWithAge.reduce((sum, p) => sum + (p.age || 0), 0) /
              patientsWithAge.length
          )
        : 0;
    const patientsWithChildren = allPatients.filter(
      (p) => p.number_of_children != null && p.number_of_children > 0
    );
    const avgChildren =
      patientsWithChildren.length > 0
        ? Math.round(
            (patientsWithChildren.reduce(
              (sum, p) => sum + (p.number_of_children || 0),
              0
            ) /
              patientsWithChildren.length) *
              10
          ) / 10
        : 0;
    const withCin = allPatients.filter((p) => p.cin).length;
    const withoutCin = totalPatients - withCin;

    // Age distribution (buckets)
    const ageBuckets: Record<string, number> = {
      "0-17": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56+": 0,
    };
    allPatients.forEach((p) => {
      if (p.age == null) return;
      if (p.age < 18) ageBuckets["0-17"]++;
      else if (p.age <= 25) ageBuckets["18-25"]++;
      else if (p.age <= 35) ageBuckets["26-35"]++;
      else if (p.age <= 45) ageBuckets["36-45"]++;
      else if (p.age <= 55) ageBuckets["46-55"]++;
      else ageBuckets["56+"]++;
    });
    const ageDistribution = Object.entries(ageBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    // Children count distribution
    const childBuckets: Record<string, number> = {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4+": 0,
    };
    allPatients.forEach((p) => {
      const n = p.number_of_children ?? 0;
      if (n === 0) childBuckets["0"]++;
      else if (n === 1) childBuckets["1"]++;
      else if (n === 2) childBuckets["2"]++;
      else if (n === 3) childBuckets["3"]++;
      else childBuckets["4+"]++;
    });
    const childrenDistribution = Object.entries(childBuckets).map(
      ([children, count]) => ({ children, count })
    );

    // Caravan stats
    const caravanStats = allCaravans.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      date_start: c.date_start,
      status: c.status,
    }));

    // Recent patients
    const recentPatients = allPatients
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
      .map((p) => ({
        name: `${p.first_name} ${p.last_name}`,
        age: p.age,
        cin: p.cin,
        children: p.number_of_children,
      }));

    return NextResponse.json({
      summary: {
        totalPatients,
        totalCaravans,
        totalChildren,
        avgAge,
        avgChildren,
        withCin,
        withoutCin,
      },
      ageDistribution,
      childrenDistribution,
      caravanStats,
      recentPatients,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(emptyStats);
  }
}
