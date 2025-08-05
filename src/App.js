import React, { useState, useMemo } from "react";
import {
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Box,
} from "@mui/material";
import { Line } from "react-chartjs-2";
// Removed import for react-csv as it's not resolvable in this environment.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components required for the Line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Options for compounding frequency
const compoundingOptions = [
  { label: "Annually", value: 1 },
  { label: "Semi-Annually", value: 2 },
  { label: "Quarterly", value: 4 },
  { label: "Monthly", value: 12 },
];

export default function App() {
  // State variables for the calculator inputs
  const [initialValue, setInitialValue] = useState(100);
  const [percentage, setPercentage] = useState(5);
  const [years, setYears] = useState(10);
  const [compoundingFreq, setCompoundingFreq] = useState(1);
  const [isGrowth, setIsGrowth] = useState(true); // true for growth, false for decay

  // Validate inputs to ensure they are positive and valid numbers
  const validInputs =
    initialValue > 0 && years > 0 && !isNaN(percentage) && compoundingFreq > 0;

  // Memoized calculation of compound values to prevent unnecessary re-renders
  const results = useMemo(() => {
    if (!validInputs) return []; // Return empty array if inputs are invalid

    const r = percentage / 100; // Convert percentage to decimal
    const n = compoundingFreq; // Compounding frequency
    const P = initialValue; // Principal (initial value)
    const tMax = years; // Maximum number of years

    // Determine if it's growth or decay to apply the correct rate
    const rate = isGrowth ? r : -r;

    const data = [];
    // Calculate compounded value for each year
    for (let year = 0; year <= tMax; year++) {
      // Compound interest formula: A = P * (1 + (rate / n))^(n * t)
      const amount = P * Math.pow(1 + rate / n, n * year);
      data.push({
        year,
        value: amount,
      });
    }
    return data;
  }, [initialValue, percentage, years, compoundingFreq, isGrowth, validInputs]);

  // Prepare data for the Chart.js Line chart
  const chartData = {
    labels: results.map((r) => `Year ${r.year}`), // X-axis labels (Years)
    datasets: [
      {
        label: "Value", // Dataset label
        data: results.map((r) => r.value.toFixed(2)), // Y-axis data (Compounded values)
        fill: false, // Do not fill area under the line
        borderColor: "rgb(75, 192, 192)", // Line color
        tension: 0.3, // Curve tension of the line
        pointRadius: 4, // Size of data points
      },
    ],
  };

  // Options for the Chart.js Line chart
  const chartOptions = {
    responsive: true, // Make chart responsive
    plugins: {
      legend: { position: "top" }, // Position of the legend
      title: {
        display: true,
        text: `Compound ${
          isGrowth ? "Growth" : "Decay"
        } Over ${years} Year(s) (${
          compoundingOptions.find((o) => o.value === compoundingFreq)?.label
        })`, // Chart title
      },
    },
    scales: {
      y: {
        beginAtZero: false, // Y-axis does not necessarily start at zero
      },
    },
  };

  // Function to handle CSV export manually without react-csv
  const handleExportCSV = () => {
    const headers = ["Year", "Value"];
    // Format results for CSV, ensuring values are rounded to 2 decimal places
    const csvRows = results.map(({ year, value }) => [year, value.toFixed(2)]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","), // Join headers with comma
      ...csvRows.map((row) => row.join(",")), // Join each row with comma
    ].join("\n"); // Join all rows with newline

    const filename = `compound_${
      isGrowth ? "growth" : "decay"
    }_${years}years.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary URL and trigger download
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL
    } else {
      // Fallback for browsers that don't support download attribute
      console.error("Download not supported in this browser.");
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Compound Growth/Decay Calculator
      </Typography>

      <Box
        component="form"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, // Responsive grid layout
          gap: 2, // Gap between grid items
          mb: 3, // Margin bottom
          alignItems: "center",
        }}
        noValidate // Disable browser's default validation
        autoComplete="off" // Disable autocomplete
      >
        <TextField
          label="Initial Number"
          type="number"
          inputProps={{ min: 0, step: "any" }} // Allow any step for decimal input
          value={initialValue}
          onChange={(e) => setInitialValue(parseFloat(e.target.value))} // Parse input as float
          required // Mark as required
        />

        <TextField
          label="Percentage Increase/Decrease (%)"
          type="number"
          inputProps={{ step: "any" }}
          value={percentage}
          onChange={(e) => setPercentage(parseFloat(e.target.value))}
          required
        />

        <TextField
          label="Number of Years"
          type="number"
          inputProps={{ min: 1, step: 1 }} // Minimum 1 year, integer steps
          value={years}
          onChange={(e) => setYears(parseInt(e.target.value, 10))} // Parse input as integer
          required
        />

        <FormControl fullWidth>
          <InputLabel id="compounding-frequency-label">
            Compounding Frequency
          </InputLabel>
          <Select
            labelId="compounding-frequency-label"
            value={compoundingFreq}
            label="Compounding Frequency"
            onChange={(e) => setCompoundingFreq(parseInt(e.target.value, 10))}
          >
            {compoundingOptions.map(({ label, value }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={isGrowth}
              onChange={() => setIsGrowth((prev) => !prev)} // Toggle growth/decay mode
              color="primary"
            />
          }
          label={isGrowth ? "Growth Mode" : "Decay Mode"}
          sx={{ gridColumn: { xs: "span 2", sm: "span 1" } }} // Span full width on small screens
        />
      </Box>

      {!validInputs && (
        <Typography color="error" sx={{ mb: 2 }}>
          Please enter valid positive numbers for initial value and years.
        </Typography>
      )}

      {validInputs && (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table aria-label="compound results table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(({ year, value }) => (
                  <TableRow
                    key={year}
                    sx={{
                      bgcolor:
                        year === years ? "rgba(25, 118, 210, 0.1)" : "inherit", // Highlight the final year
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {year}
                    </TableCell>
                    <TableCell align="right">{value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mb: 3 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            {/* Replaced CSVLink with a standard Button and a custom export function */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportCSV}
            >
              Export Results to CSV
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
