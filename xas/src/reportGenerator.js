const fs = require("fs");
const path = require("path");
const { colorSeverity } = require("./issue");

function generateTxtReport(issues) {
  let txt = "XAS Security Report\n=====================\n\n";

  issues.forEach(i => {
    txt += `ID: ${i.id}\n`;
    txt += `Severity: ${i.severity}\n`;
    txt += `Source: ${i.source}\n`;
    txt += `Location: ${i.url || i.ip + ":" + i.port}\n`;
    txt += `Title: ${i.title}\n`;
    txt += `Description: ${i.description}\n`;
    txt += `-----------------------------\n`;
  });

  const file = path.join(__dirname, "../reports/report.txt");
  fs.writeFileSync(file, txt);

  return file;
}

function generateHtmlReport(issues) {
  let html = `
<html>
<head>
<title>XAS Security Report</title>
<style>
body { font-family: Arial; background: #111; color: #eee; padding: 20px; }
h1 { color: #6cf; }
.issue { border: 1px solid #444; padding: 10px; margin-bottom: 10px; }
.critical { color: #f0f; }
.high { color: #f33; }
.medium { color: #fc3; }
.low { color: #3cf; }
.info { color: #ccc; }
</style>
</head>
<body>
<h1>XAS Security Report</h1>
`;

  issues.forEach(i => {
    html += `
<div class="issue ${i.severity}">
  <h2>${i.title}</h2>
  <p><b>ID:</b> ${i.id}</p>
  <p><b>Severity:</b> ${i.severity}</p>
  <p><b>Source:</b> ${i.source}</p>
  <p><b>Location:</b> ${i.url || i.ip + ":" + i.port}</p>
  <p><b>Description:</b> ${i.description}</p>
</div>
`;
  });

  html += "</body></html>";

  const file = path.join(__dirname, "../reports/report.html");
  fs.writeFileSync(file, html);

  return file;
}

module.exports = {
  generateTxtReport,
  generateHtmlReport
};