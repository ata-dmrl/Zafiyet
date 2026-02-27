// src/toolCheck.js
const { execSync } = require("child_process");

function checkTool(name, command) {
  try {
    execSync(command, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function checkAllTools() {
  const tools = [
    { name: "Nmap", command: "nmap --version", install: "https://nmap.org/download.html" },
    { name: "ZAP", command: process.platform === "win32" ? "zap.bat -version" : "zap.sh -version", install: "https://www.zaproxy.org/download/" }
  ];

  console.log("\x1b[36m[*] Araç Durumu Kontrolü\x1b[0m");
  console.log("─".repeat(45));

  const results = {};

  tools.forEach(tool => {
    const installed = checkTool(tool.name, tool.command);
    results[tool.name.toLowerCase()] = installed;

    if (installed) {
      console.log(`  \x1b[32m✔ ${tool.name}\x1b[0m  → Kurulu`);
    } else {
      console.log(`  \x1b[31m✘ ${tool.name}\x1b[0m  → Kurulu değil`);
      console.log(`    \x1b[33m↳ İndir: ${tool.install}\x1b[0m`);
    }
  });

  console.log("─".repeat(45));
  return results;
}

function getToolStatus() {
  const nmap = checkTool("Nmap", "nmap --version");
  const zap = checkTool("ZAP", process.platform === "win32" ? "zap.bat -version" : "zap.sh -version");
  return { nmap, zap };
}

module.exports = { checkAllTools, getToolStatus };
