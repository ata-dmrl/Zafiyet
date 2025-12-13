const { color, colorSeverity } = require("./issue");
const { FIX_GUIDES } = require("./fixGuides");
const { parseNmapFile } = require("./parsers/nmap");
const { parseZapFile } = require("./parsers/zap");
const { runNmap, runNmapFull } = require("./runners/nmapRunner");
const { runZap, runZapFull } = require("./runners/zapRunner");
const { generateTxtReport, generateHtmlReport } = require("./reportGenerator");

class XasContext {
  constructor() {
    this.issues = [];
    this.nextId = 1;
  }
}

function printFixGuide(fixKey) {
  const guide = FIX_GUIDES[fixKey];
  if (!guide) {
    console.log("Bu zafiyet türü için henüz fix rehberi tanımlanmamış.");
    return;
  }

  console.log(`\x1b[35m\n=== [${guide.severity.toUpperCase()}] ${guide.title} ===\n\x1b[0m`);

  guide.steps.forEach((step, index) => {
    console.log(`\x1b[32m[${index + 1}] ${step.title}\x1b[0m`);
    (step.items || []).forEach(item => {
      console.log("  \x1b[34m" + item + "\x1b[0m");
    });
    console.log("");
  });

  console.log("\x1b[33mÖneri:\x1b[0m");
  console.log("  " + guide.recommendation + "\n");
}

async function handleCommand(ctx, line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case "help":
      console.log(`
      Komutlar:
        help                       Yardım
        run nmap <args>            Nmap çalıştır
        run nmap full <target>     Nmap tam tarama
        run zap <url>              ZAP hızlı tarama
        run zap full <url>         ZAP tam tarama
        load nmap <dosya>          Nmap XML raporunu yükle
        load zap <dosya>           ZAP JSON raporunu yükle
        list [sev=<level>]         Zafiyetleri listele
        stats                      Zafiyet istatistikleri
        fix <id>                   Fix rehberi göster
        exit                       Çıkış
      `);
      break;

    case "run":
      if (args[0] === "nmap") {
        if (args[1] === "full") {
          await runNmapFull(ctx, args[2]);
        } else {
          await runNmap(ctx, args.slice(1));
        }
      } else if (args[0] === "zap") {
        if (args[1] === "full") {
          await runZapFull(ctx, args[2]);
        } else {
          await runZap(ctx, args.slice(1));
        }
      } else {
        console.log("Kullanım: run nmap <args> | run nmap full <target> | run zap <url> | run zap full <url>");
      }
      break;

    case "load":
      if (args[0] === "nmap" && args[1]) {
        try {
          const { issues, nextId } = await parseNmapFile(args[1], ctx.nextId);
          ctx.issues.push(...issues);
          ctx.nextId = nextId;
          console.log(`\x1b[32mNmap raporu yüklendi. Eklenen issue sayısı: ${issues.length}\x1b[0m`);
        } catch (e) {
          console.log(`\x1b[31mHata: ${e.message}\x1b[0m`);
        }
      } else if (args[0] === "zap" && args[1]) {
        try {
          const { issues, nextId } = parseZapFile(args[1], ctx.nextId);
          ctx.issues.push(...issues);
          ctx.nextId = nextId;
          console.log(`\x1b[32mZAP raporu yüklendi. Eklenen issue sayısı: ${issues.length}\x1b[0m`);
        } catch (e) {
          console.log(`\x1b[31mHata: ${e.message}\x1b[0m`);
        }
      } else {
        console.log("Kullanım: load nmap <dosya> | load zap <dosya>");
      }
      break;

    case "list": {
      let filterSeverity = null;
      if (args[0] && args[0].startsWith("sev=")) {
        filterSeverity = args[0].split("=")[1];
      }

      let list = ctx.issues;
      if (filterSeverity) {
        list = list.filter(i => i.severity === filterSeverity);
      }

      if (list.length === 0) {
        console.log("Gösterilecek issue yok.");
        break;
      }

      list.forEach(i => {
        const sevLabel = colorSeverity(i.severity, `[${i.severity.toUpperCase()}]`);
        const idLabel = color(`#${i.id}`, "37");
        const loc = i.url || `${i.ip || i.host}:${i.port || ""}`;
        console.log(`${idLabel} ${sevLabel} (${i.source}) ${loc} - ${i.title}`);
      });

      console.log(`Toplam: ${list.length} issue.`);
      break;
    }

    case "stats": {
      const counts = {};
      ctx.issues.forEach(i => {
        counts[i.severity] = (counts[i.severity] || 0) + 1;
      });

      console.log("Zafiyet istatistikleri:");
      Object.entries(counts).forEach(([sev, count]) => {
        console.log(colorSeverity(sev, `${sev.toUpperCase()}: ${count}`));
      });
      break;
    }

    case "fix": {
      const id = parseInt(args[0], 10);
      if (isNaN(id)) {
        console.log("Kullanım: fix <id>");
        break;
      }
      const issue = ctx.issues.find(i => i.id === id);
      if (!issue) {
        console.log("Bu ID'ye ait issue bulunamadı.");
        break;
      }
      if (!issue.fixKey) {
        console.log("Bu issue için fix rehberi tanımlanmamış.");
        break;
      }
      printFixGuide(issue.fixKey);
      break;
    }

    case "report":
      console.log("TXT rapor oluşturuluyor...");
      const txt = generateTxtReport(ctx.issues);
      console.log("TXT rapor oluşturuldu:", txt);

      console.log("HTML rapor oluşturuluyor...");
      const html = generateHtmlReport(ctx.issues);
      console.log("HTML rapor oluşturuldu:", html);
      break;

    case "exit":
      process.exit(0);

    default:
      console.log("Bilinmeyen komut. 'help' yazabilirsin.");
      break;
  }
}

module.exports = {
  XasContext,
  handleCommand
};