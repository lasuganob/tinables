import { Alert } from "@mui/material";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export function LineChart({ data }) {
  if (!data.length) {
    return <Alert severity="info">No transactions yet.</Alert>;
  }

  const options = {
    chart: {
      type: "line",
      backgroundColor: "transparent",
      height: 360
    },
    title: {
      text: null
    },
    xAxis: {
      categories: data.map((entry) =>
        new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      )
    },
    yAxis: {
      title: {
        text: "Amount"
      }
    },
    tooltip: {
      shared: true,
      valueDecimals: 2
    },
    credits: {
      enabled: false
    },
    series: [
      {
        name: "Income",
        data: data.map((entry) => entry.income),
        color: "#059669"
      },
      {
        name: "Expense",
        data: data.map((entry) => entry.expense),
        color: "#dc2626"
      }
    ]
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
