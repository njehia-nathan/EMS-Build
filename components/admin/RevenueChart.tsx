// components/admin/RevenueChart.tsx
"use client";

import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend
);

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
};

type RevenueChartProps = {
  data: {
    labels: string[];
    revenue: number[];
    tickets?: number[];
    events?: number[];
    users?: number[];
  };
  type?: "revenue" | "events" | "users" | "overview";
};

export default function RevenueChart({ data, type = "revenue" }: RevenueChartProps) {
  const chartData: ChartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Revenue (KSh)",
        data: data.revenue,
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        fill: false,
      },
    ],
  };

  if (type === "events" && data.events) {
    chartData.datasets = [
      {
        label: "Events Created",
        data: data.events,
        borderColor: "rgba(16, 185, 129, 1)", // green-500
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        fill: false,
      },
    ];
  }

  if (type === "overview") {
    chartData.datasets = [
      {
        label: "Revenue (KSh)",
        data: data.revenue,
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        fill: false,
      },
    ];
    
    if (data.tickets) {
      chartData.datasets.push({
        label: "Tickets Sold",
        data: data.tickets,
        borderColor: "rgba(245, 158, 11, 1)", // amber-500
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        fill: false,
      });
    }
    
    if (data.events) {
      chartData.datasets.push({
        label: "Events Created",
        data: data.events,
        borderColor: "rgba(16, 185, 129, 1)", // green-500
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        fill: false,
      });
    }
    
    if (data.users) {
      chartData.datasets.push({
        label: "New Users",
        data: data.users,
        borderColor: "rgba(124, 58, 237, 1)", // purple-600
        backgroundColor: "rgba(124, 58, 237, 0.5)",
        fill: false,
      });
    }
  }

  const options: ChartOptions<"line" | "bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (label.includes("Revenue")) {
                label += "KSh " + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y.toLocaleString();
              }
            }
            return label;
          }
        }
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
          callback: function(value) {
            if (type === "revenue" || type === "overview") {
              return "KSh " + Number(value).toLocaleString();
            }
            return value;
          }
        }
      },
    },
  };

  return (
    <div className="h-80">
      {type === "overview" ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}