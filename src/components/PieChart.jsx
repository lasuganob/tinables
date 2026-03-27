import { Alert } from "@mui/material";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export function PieChart({ data }) {
  if (!data.length) {
    return <Alert severity="info">No expense data available.</Alert>;
  }

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 360
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
          enabled: true,
          format: "{point.name}: {point.percentage:.1f}%"
        }
      }
    },
    series: [
      {
        name: "Expenses",
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
