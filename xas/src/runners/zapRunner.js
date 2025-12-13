const { spawn } = require("child_process");
const path = require("path");
const { parseZapFile } = require("../parsers/zap");

function getZapCommand() {
  return process.platform === "win32" ? "zap.bat" : "zap.sh";
}

function runZap(ctx, args) {
  return new Promise(resolve => {
    const target = args[0];
    const outputFile = path.join(__dirname, "../../zap_output.json");

    const zapCmd = getZapCommand();

    console.log(`\n--- ZAP Hızlı Tarama Başlıyor: ${target} ---\n`);

    const zap = spawn(zapCmd, ["-cmd", "-quickurl", target, "-quickout", outputFile]);

    zap.stdout.on("data", data => {
      process.stdout.write(data.toString());
    });

    zap.stderr.on("data", data => {
      process.stdout.write(data.toString());
    });

    zap.on("close", () => {
      console.log("\n--- ZAP Bitti, Çıktı Parse Ediliyor ---\n");

      try {
        const { issues, nextId } = parseZapFile(outputFile, ctx.nextId);
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

function runZapFull(ctx, target) {
  const zapCmd = getZapCommand();
  return runZap(ctx, ["full", target]);
}

module.exports = { runZap, runZapFull };