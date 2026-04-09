import { Alert } from "@mui/material";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export function PieChart({ data, seriesName = "Expenses", emptyMessage = "No data available." }) {
  if (!data.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 500
    },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    tooltip: {
      pointFormat: "<b>{point.y:.2f}</b>"
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    series: [
      {
        name: seriesName,
        colorByPoint: true,
        data: data.map((item) => ({
          name: item.name,
          y: item.value
        }))
      }
    ]
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
