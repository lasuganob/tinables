import { Alert } from "@mui/material";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCurrency } from "../lib/format";

export function PieChart({
  data,
  seriesName = "Expenses",
  emptyMessage = "No data available.",
  variant = "pie",
  showCenterTotal = false,
  centerTotalLabel = "Total",
  centerTotalFormatter = formatCurrency,
  legendValueFormatter = formatCurrency,
}) {
  if (!data.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  const isDonut = variant === "donut";
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 500,
      events: showCenterTotal
        ? {
            render() {
              const series = this.series[0];

              if (!series?.center) {
                return;
              }

              const [centerX, centerY] = series.center;
              const labelText = `<span style="font-size: 12px; color: #64748b; font-weight: 600;">${centerTotalLabel}</span><br/><span style="font-size: 20px; color: #0f172a; font-weight: 800;">${centerTotalFormatter(total)}</span>`;

              if (!this.centerTotalLabel) {
                this.centerTotalLabel = this.renderer
                  .label(labelText, 0, 0, undefined, undefined, undefined, true)
                  .css({ textAlign: "center" })
                  .add();
              } else {
                this.centerTotalLabel.attr({ text: labelText });
              }

              const boundingBox = this.centerTotalLabel.getBBox();
              this.centerTotalLabel.attr({
                x: this.plotLeft + centerX - boundingBox.width / 2,
                y: this.plotTop + centerY - boundingBox.height / 2,
              });
            },
          }
        : undefined,
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
    legend: {
      labelFormatter() {
        return `${this.name} (${legendValueFormatter(this.y)})`;
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        innerSize: isDonut ? "62%" : "0%",
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
