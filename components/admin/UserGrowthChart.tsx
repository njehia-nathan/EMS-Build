// components/admin/UserGrowthChart.tsx
"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type UserGrowthChartProps = {
  data: {
    labels: string[];
    newUsers: number[];
    cumulativeUsers: number[];
    activeUsers?: number[];
  };
};

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "New Users",
        data: data.newUsers,
        borderColor: "rgba(124, 58, 237, 1)", // purple-600
        backgroundColor: "rgba(124, 58, 237, 0.5)",
        borderWidth: 2,
      },
      {
        label: "Cumulative Users",
        data: data.cumulativeUsers,
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  if (data.activeUsers) {
    chartData.datasets.push({
      label: "Active Users",
      data: data.activeUsers,
      borderColor: "rgba(16, 185, 129, 1)", // green-500
      backgroundColor: "rgba(16, 185, 129, 0.5)",
      borderWidth: 2,
      borderDash: [5, 5],
    });
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}