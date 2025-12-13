const { exec } = require("child_process");
const path = require("path");
const { parseZapFile } = require("../parsers/zap");

function runZap(ctx, args) {
  return new Promise(resolve => {
    const target = args[0];
    const outputFile = path.join(__dirname, "../../zap_output.json");

    console.log(`ZAP hızlı tarama başlatılıyor: ${target}`);

    exec(`zap.sh -cmd -quickurl ${target} -quickout ${outputFile}`, (error) => {
      if (error) {
        console.log("Hata:", error.message);
        return resolve();
      }

      console.log("ZAP taraması tamamlandı. Çıktı parse ediliyor...");

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
  return new Promise(resolve => {
    const outputFile = path.join(__dirname, "../../zap_output.json");

    console.log(`ZAP TAM TARAMA başlatılıyor: ${target}`);

    exec(`zap.sh -cmd -quickurl ${target} -quickout ${outputFile} -fullscan`, (error) => {
      if (error) {
        console.log("Hata:", error.message);
        return resolve();
      }

      console.log("ZAP tam tarama tamamlandı. Çıktı parse ediliyor...");

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

module.exports = { runZap, runZapFull };