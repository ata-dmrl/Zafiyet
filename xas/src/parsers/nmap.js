// src/parsers/nmap.js

const fs = require("fs");
const xml2js = require("xml2js");
const { Issue } = require("../issue");

function mapPortToFixKey(port) {
  switch (String(port)) {
    case "23":
      return "telnet";
    case "21":
      return "ftp";
    case "3389":
      return "rdp";
    default:
      return null;
  }
}

async function parseNmapFile(path, startId) {
  const xml = fs.readFileSync(path, "utf8");
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  const issues = [];
  let currentId = startId;

  const hosts = result.nmaprun?.host || [];
  hosts.forEach(h => {
    const ip = h.address?.[0]?.$?.addr;
    const ports = h.ports?.[0]?.port || [];
    ports.forEach(p => {
      const portId = p.$.portid;
      const state = p.state?.[0]?.$?.state;
      const serviceName = p.service?.[0]?.$?.name;

      if (state === "open") {
        const sev =
          portId === "23" || portId === "21" || portId === "3389"
            ? "high"
            : "medium";

        issues.push(
          new Issue({
            id: currentId++,
            source: "nmap",
            ip,
            port: portId,
            severity: sev,
            title: `Open port ${portId} (${serviceName || "unknown"})`,
            description: `Host ${ip} üzerinde ${portId}/TCP portu açık.`,
            fixKey: mapPortToFixKey(portId)
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