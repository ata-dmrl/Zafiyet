// src/parsers/zap.js

const fs = require("fs");
const { Issue } = require("../issue");

function mapZapAlertToFixKey(alert) {
  const name = (alert.name || "").toLowerCase();

  if (name.includes("sql injection")) return "sql_injection";
  if (name.includes("command injection")) return "command_injection";
  if (name.includes("xss")) return "xss";
  if (name.includes("csrf")) return "csrf";

  return null;
}

function mapZapRiskToSeverity(risk) {
  const r = (risk || "").toLowerCase();
  if (r === "high") return "critical";
  if (r === "medium") return "high";
  if (r === "low") return "medium";
  return "info";
}

function parseZapFile(path, startId) {
  const raw = fs.readFileSync(path, "utf8");
  const data = JSON.parse(raw);

  const issues = [];
  let currentId = startId;

  const sites = data.site || [];
  sites.forEach(site => {
    const host = site.name;
    (site.alerts || []).forEach(alert => {
      const sev = mapZapRiskToSeverity(alert.risk);
      const fixKey = mapZapAlertToFixKey(alert);

      issues.push(
        new Issue({
          id: currentId++,
          source: "zap",
          host,
          url: alert.url,
          severity: sev,
          title: alert.name,
          description: alert.desc || "",
          fixKey
        })
      );
    });
  });

  return { issues, nextId: currentId };
}

module.exports = {
  parseZapFile
};