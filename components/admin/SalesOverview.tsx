// components/admin/SalesOverview.tsx
"use client";

import { Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type SalesOverviewProps = {
  data: {
    labels: string[];
    values: number[];
  };
  type: 'paymentMethod' | 'timeOfDay' | 'category' | 'fillRate' | 'activity' | 'spend' | 'conversion' | 'refund' | 'utilization';
};

// Define color schemes for different chart types
const colorSchemes = {
  paymentMethod: ["#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981"],
  timeOfDay: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
  category: ["#10b981", "#34d399", "#6ee7b7", "#d1fae5", "#ecfdf5"],
  fillRate: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#fffbeb"],
  activity: ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
  spend: ["#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#fef2f2"],
  conversion: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"],
  refund: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
  utilization: ["#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"],
};

export default function SalesOverview({ data, type }: SalesOverviewProps) {
  const colors = colorSchemes[type] || colorSchemes.paymentMethod;
  
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors,
        borderColor: colors.map(color => color + "99"),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie" | "doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        align: "center" as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || "";
            let value = context.raw as number;
            
            if (label) {
              label += ": ";
            }
            
            if (type === 'paymentMethod' || type === 'spend') {
              label += "KSh " + value.toLocaleString();
            } else if (type === 'fillRate' || type === 'conversion' || type === 'refund' || type === 'utilization') {
              label += value.toFixed(1) + "%";
            } else {
              label += value.toLocaleString();
            }
            
            return label;
          }
        }
      },
    },
  };

  // Use Doughnut chart for some types, Pie chart for others
  const usesDoughnut = ['fillRate', 'conversion', 'refund', 'utilization'].includes(type);

  return (
    <div className="h-64">
      {usesDoughnut ? (
        <Doughnut data={chartData} options={options} />
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  );
}