// src/issue.js

const SEVERITY_COLORS = {
  critical: "\x1b[35m", // mor
  high: "\x1b[31m",     // kırmızı
  medium: "\x1b[33m",   // sarı
  low: "\x1b[36m",      // cyan
  info: "\x1b[37m"      // beyaz
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function color(text, colorCode) {
  return `${colorCode}${text}\x1b[0m`;
}

function colorSeverity(severity, text) {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  return color(text, c);
}

class Issue {
  constructor({
    id,
    source,
    host,
    ip,
    port,
    url,
    severity,
    title,
    description,
    fixKey,
    cve,
    confidence,
    timestamp
  }) {
    this.id = id ?? null;
    this.source = source || "";
    this.host = host || "";
    this.ip = ip || "";
    this.port = port || null;
    this.url = url || "";
    this.severity = severity || "info";
    this.title = title || "";
    this.description = description || "";
    this.fixKey = fixKey || null;
    this.cve = cve || null;
    this.confidence = confidence || null;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

module.exports = {
  Issue,
  color,
  colorSeverity,
  SEVERITY_ORDER,
  SEVERITY_COLORS
};