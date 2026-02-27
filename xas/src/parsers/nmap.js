// src/parsers/nmap.js

const fs = require("fs");
const xml2js = require("xml2js");
const { Issue } = require("../issue");

const PORT_FIX_MAP = {
  "21": { fixKey: "ftp", severity: "high", label: "FTP" },
  "23": { fixKey: "telnet", severity: "high", label: "Telnet" },
  "445": { fixKey: "smb", severity: "high", label: "SMB" },
  "1433": { fixKey: "mssql", severity: "high", label: "MSSQL" },
  "3306": { fixKey: "mysql", severity: "high", label: "MySQL" },
  "3389": { fixKey: "rdp", severity: "high", label: "RDP" },
  "5900": { fixKey: "vnc", severity: "high", label: "VNC" },
  "6379": { fixKey: "redis", severity: "high", label: "Redis" },
  "8080": { fixKey: "http_proxy", severity: "medium", label: "HTTP Proxy" },
  "27017": { fixKey: "mongodb", severity: "high", label: "MongoDB" }
};

function getPortInfo(portId) {
  return PORT_FIX_MAP[String(portId)] || null;
}

function extractCVEs(scriptOutput) {
  if (!scriptOutput) return [];
  const cveRegex = /CVE-\d{4}-\d{4,}/gi;
  const matches = scriptOutput.match(cveRegex);
  return matches ? [...new Set(matches)] : [];
}

async function parseNmapFile(filePath, startId) {
  const xml = fs.readFileSync(filePath, "utf8");
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  const issues = [];
  let currentId = startId;

  const hosts = result.nmaprun?.host || [];
  hosts.forEach(h => {
    const ip = h.address?.[0]?.$?.addr;
    const hostname = h.hostnames?.[0]?.hostname?.[0]?.$?.name || "";
    const ports = h.ports?.[0]?.port || [];

    ports.forEach(p => {
      const portId = p.$.portid;
      const protocol = p.$.protocol || "tcp";
      const state = p.state?.[0]?.$?.state;
      const serviceName = p.service?.[0]?.$?.name || "unknown";
      const serviceVersion = p.service?.[0]?.$?.version || "";
      const serviceProduct = p.service?.[0]?.$?.product || "";

      // Script çıktılarından CVE toplama
      let scriptOutput = "";
      let cves = [];
      if (p.script) {
        p.script.forEach(s => {
          scriptOutput += (s.$.output || "") + " ";
        });
        cves = extractCVEs(scriptOutput);
      }

      if (state === "open") {
        const portInfo = getPortInfo(portId);
        const sev = portInfo ? portInfo.severity : "medium";
        const fixKey = portInfo ? portInfo.fixKey : null;

        const serviceStr = serviceProduct
          ? `${serviceName} (${serviceProduct} ${serviceVersion})`.trim()
          : serviceName;

        issues.push(
          new Issue({
            id: currentId++,
            source: "nmap",
            ip,
            host: hostname,
            port: portId,
            severity: sev,
            title: `Açık Port: ${portId}/${protocol} (${serviceStr})`,
            description: `Host ${ip}${hostname ? " (" + hostname + ")" : ""} üzerinde ${portId}/${protocol} portu açık. Servis: ${serviceStr}.${cves.length > 0 ? " İlişkili CVE: " + cves.join(", ") : ""}`,
            fixKey,
            cve: cves.length > 0 ? cves.join(", ") : null
          })
        );
      }
    });
  });

  return { issues, nextId: currentId };
}

module.exports = {
  parseNmapFile
};