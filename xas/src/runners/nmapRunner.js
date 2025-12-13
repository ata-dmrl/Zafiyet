const { exec } = require("child_process");
const path = require("path");
const { parseNmapFile } = require("../parsers/nmap");

function runNmap(ctx, args) {
  return new Promise(resolve => {
    const nmapArgs = args.join(" ");
    const outputFile = path.join(__dirname, "../../nmap_output.xml");

    console.log(`Nmap çalıştırılıyor: nmap ${nmapArgs}`);

    exec(`nmap ${nmapArgs} -oX ${outputFile}`, async (error) => {
      if (error) {
        console.log("Hata:", error.message);
        return resolve();
      }

      console.log("Nmap taraması tamamlandı. Çıktı parse ediliyor...");

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
  return runNmap(ctx, [
    "-sV",
    "-sC",
    "-A",
    "-O",
    "-p-",
    "-T4",
    target
  ]);
}

module.exports = { runNmap, runNmapFull };