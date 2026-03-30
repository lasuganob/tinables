import { Alert } from "@mui/material";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatMonthDay } from "../lib/format";

export function LineChart({ chartData }) {
  if (!chartData.categories.length || !chartData.series.length) {
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
      categories: chartData.categories.map((entry) => formatMonthDay(entry))
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
    series: chartData.series
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
