const { spawn } = require("child_process");
const path = require("path");
const { parseNmapFile } = require("../parsers/nmap");

function runNmap(ctx, args) {
  return new Promise(resolve => {
    const outputFile = path.join(__dirname, "../../nmap_output.xml");

    const nmap = spawn("nmap", [...args, "-oX", outputFile]);

    console.log("\n--- Nmap Çalışıyor (Canlı Çıktı) ---\n");

    nmap.stdout.on("data", data => {
      process.stdout.write(data.toString());
    });

    nmap.stderr.on("data", data => {
      process.stdout.write(data.toString());
    });

    nmap.on("close", async () => {
      console.log("\n--- Nmap Bitti, Çıktı Parse Ediliyor ---\n");

      try {
        const { issues, nextId } = await parseNmapFile(outputFile, ctx.nextId);
        ctx.issues.push(...issues);
        ctx.nextId = nextId;

        console.log(`Toplam ${issues.length} yeni zafiyet eklendi.`);
      } catch (e) {
        console.log("Parse hatası:", e.message);
      }

      resolve();
    });
  });
}

function runNmapFull(ctx, target) {
  return runNmap(ctx, ["-sV", "-sC", "-A", "-O", "-p-", "-T4", target]);
}

module.exports = { runNmap, runNmapFull };