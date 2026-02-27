const { color, colorSeverity, SEVERITY_ORDER } = require("./issue");
const { FIX_GUIDES } = require("./fixGuides");
const { parseNmapFile } = require("./parsers/nmap");
const { parseZapFile } = require("./parsers/zap");
const { runNmap, runNmapFull } = require("./runners/nmapRunner");
const { runZap, runZapFull } = require("./runners/zapRunner");
const { generateTxtReport, generateHtmlReport, generateJsonReport } = require("./reportGenerator");
const { checkAllTools, getToolStatus } = require("./toolCheck");
const { applyAutoFix } = require("./autoFixer");
const fs = require("fs");
const path = require("path");
const net = require("net");
const readline = require("readline");

class XasContext {
  constructor() {
    this.issues = [];
    this.nextId = 1;
  }
}

function isIP(str) {
  return net.isIP(str) !== 0;
}

function isURL(str) {
  return str.startsWith("http://") || str.startsWith("https://") || str.includes(".");
}

function printFixGuide(fixKey) {
  const guide = FIX_GUIDES[fixKey];
  if (!guide) {
    console.log("\x1b[31m  Bu zafiyet türü için henüz fix rehberi tanımlanmamış.\x1b[0m");
    return;
  }

  console.log(`\x1b[35m\n╔══════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[35m║\x1b[0m  \x1b[1m[${guide.severity.toUpperCase()}] ${guide.title}\x1b[0m`);
  console.log(`\x1b[35m╚══════════════════════════════════════════════════╝\x1b[0m`);

  guide.steps.forEach((step, index) => {
    console.log(`\n  \x1b[32m[${index + 1}] ${step.title}\x1b[0m`);
    (step.items || []).forEach(item => {
      console.log(`     \x1b[36m→\x1b[0m ${item}`);
    });
  });

  console.log(`\n  \x1b[33m💡 Öneri:\x1b[0m`);
  console.log(`     ${guide.recommendation}\n`);

  if (guide.autoFix) {
    console.log(`  \x1b[35m[!] Bu zafiyet için OTOMATİK DÜZELTME (Auto-Fix) mevcuttur.\x1b[0m`);
    console.log(`      Otomatik kapatmak için \x1b[36mfix auto <id>\x1b[0m komutunu kullanabilirsiniz.\n`);
  }
}

function askConfirmation(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

function printHelp() {
  console.log(`
\x1b[36m╔══════════════════════════════════════════════════════╗\x1b[0m
\x1b[36m║\x1b[0m              \x1b[1mXAS Komut Rehberi\x1b[0m                       \x1b[36m║\x1b[0m
\x1b[36m╚══════════════════════════════════════════════════════╝\x1b[0m

  \x1b[33m─── GENEL ───\x1b[0m
  help                           Yardım menüsü
  tools                          Kurulu araç durumu
  clear                          Ekranı temizle
  exit                           Çıkış

  \x1b[33m─── AKILLI TARAMA ───\x1b[0m
  scan <ip/domain>               Otomatik tarama (IP→Nmap, URL→ZAP)
  scan full <ip/domain>          Kapsamlı tarama (Nmap + ZAP birlikte)

  \x1b[33m─── NMAP ───\x1b[0m
  run nmap <args>                Nmap çalıştır (özel argümanlarla)
  run nmap full <hedef>          Nmap tam tarama (-sV -sC -A -O -p-)
  load nmap <dosya.xml>          Nmap XML raporunu yükle

  \x1b[33m─── ZAP ───\x1b[0m
  run zap <url>                  ZAP hızlı tarama
  run zap full <url>             ZAP tam tarama
  load zap <dosya.json>          ZAP JSON raporunu yükle

  \x1b[33m─── ZAFİYET YÖNETİMİ ───\x1b[0m
  list [sev=<level>]             Zafiyetleri listele (filtrelenebilir)
  search <anahtar kelime>        Zafiyet ara
  detail <id>                    Zafiyet detaylarını göster
  fix <id>                       Fix rehberi göster
  fix auto <id>                  Zafiyeti otomatik düzelt (varsa)
  stats                          Zafiyet istatistikleri

  \x1b[33m─── RAPORLAMA ───\x1b[0m
  report                         TXT + HTML + JSON rapor oluştur
  export json                    JSON formatında dışa aktar
  export csv                     CSV formatında dışa aktar

  \x1b[33m─── SEVERİTY SEVİYELERİ ───\x1b[0m
  \x1b[35m  CRITICAL\x1b[0m  →  Kritik (hemen müdahale gerekir)
  \x1b[31m  HIGH\x1b[0m      →  Yüksek (en kısa sürede düzeltilmeli)
  \x1b[33m  MEDIUM\x1b[0m    →  Orta (planlı düzeltme)
  \x1b[36m  LOW\x1b[0m       →  Düşük (düşük öncelikli)
  \x1b[37m  INFO\x1b[0m      →  Bilgi (kayıt amaçlı)
`);
}

function printIssueDetail(issue) {
  const sevLabel = colorSeverity(issue.severity, issue.severity.toUpperCase());
  console.log(`
\x1b[36m┌──────────────────────────────────────────────────┐\x1b[0m
\x1b[36m│\x1b[0m  \x1b[1mZafiyet Detayı - #${issue.id}\x1b[0m
\x1b[36m└──────────────────────────────────────────────────┘\x1b[0m

  \x1b[37mBaşlık      :\x1b[0m ${issue.title}
  \x1b[37mSeverity    :\x1b[0m ${sevLabel}
  \x1b[37mKaynak      :\x1b[0m ${issue.source}
  \x1b[37mKonum       :\x1b[0m ${issue.url || (issue.ip + ":" + issue.port)}
  \x1b[37mHost        :\x1b[0m ${issue.host || issue.ip || "-"}
  \x1b[37mPort        :\x1b[0m ${issue.port || "-"}
  \x1b[37mCVE         :\x1b[0m ${issue.cve || "-"}
  \x1b[37mGüvenilirlik:\x1b[0m ${issue.confidence || "-"}
  \x1b[37mFix Key     :\x1b[0m ${issue.fixKey || "-"}
  \x1b[37mZaman       :\x1b[0m ${issue.timestamp}

  \x1b[37mAçıklama    :\x1b[0m
  ${issue.description || "-"}
`);

  if (issue.fixKey && FIX_GUIDES[issue.fixKey]) {
    console.log("  \x1b[33m💡 Fix rehberi mevcut: \x1b[0m\x1b[36mfix " + issue.id + "\x1b[0m");
    if (FIX_GUIDES[issue.fixKey].autoFix) {
      console.log("  \x1b[35m⚡ Otomatik düzeltme mevcut: \x1b[0m\x1b[36mfix auto " + issue.id + "\x1b[0m");
    }
    console.log("");
  }
}

async function handleCommand(ctx, line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case "help":
      printHelp();
      break;

    case "tools":
      checkAllTools();
      break;

    case "clear":
      console.clear();
      break;

    // ──────── AKILLI TARAMA ────────
    case "scan": {
      if (args.length === 0) {
        console.log("\x1b[31m  Kullanım: scan <ip/domain> veya scan full <ip/domain>\x1b[0m");
        break;
      }

      const toolStatus = getToolStatus();
      const isFull = args[0] === "full";
      const target = isFull ? args[1] : args[0];

      if (!target) {
        console.log("\x1b[31m  Hedef belirtilmedi.\x1b[0m");
        break;
      }

      console.log(`\n\x1b[36m  [*] Hedef analiz ediliyor: ${target}\x1b[0m`);

      if (isFull) {
        // Full scan: hem Nmap hem ZAP
        console.log("\x1b[33m  [*] Kapsamlı tarama modu (Nmap + ZAP)\x1b[0m\n");

        if (toolStatus.nmap) {
          console.log("\x1b[32m  [1/2] Nmap taraması başlatılıyor...\x1b[0m");
          await runNmapFull(ctx, target);
        } else {
          console.log("\x1b[31m  [!] Nmap kurulu değil, atlanıyor.\x1b[0m");
        }

        const zapTarget = target.startsWith("http") ? target : `http://${target}`;
        if (toolStatus.zap) {
          console.log("\x1b[32m  [2/2] ZAP taraması başlatılıyor...\x1b[0m");
          await runZapFull(ctx, zapTarget);
        } else {
          console.log("\x1b[31m  [!] ZAP kurulu değil, atlanıyor.\x1b[0m");
        }
      } else if (isIP(target)) {
        // IP → Nmap
        if (toolStatus.nmap) {
          console.log("\x1b[32m  [*] IP adresi algılandı → Nmap taraması başlatılıyor...\x1b[0m\n");
          await runNmap(ctx, ["-sV", target]);
        } else {
          console.log("\x1b[31m  [!] Nmap kurulu değil. Kurmak için: https://nmap.org/download.html\x1b[0m");
        }
      } else if (isURL(target)) {
        // URL → ZAP
        const zapTarget = target.startsWith("http") ? target : `http://${target}`;
        if (toolStatus.zap) {
          console.log("\x1b[32m  [*] Web adresi algılandı → ZAP taraması başlatılıyor...\x1b[0m\n");
          await runZap(ctx, [zapTarget]);
        } else {
          console.log("\x1b[31m  [!] ZAP kurulu değil. Kurmak için: https://www.zaproxy.org/download/\x1b[0m");
        }
      } else {
        // Ne IP ne URL, Nmap dene
        if (toolStatus.nmap) {
          console.log("\x1b[32m  [*] Nmap ile taranıyor...\x1b[0m\n");
          await runNmap(ctx, ["-sV", target]);
        } else {
          console.log("\x1b[31m  [!] Nmap kurulu değil.\x1b[0m");
        }
      }

      if (ctx.issues.length > 0) {
        console.log(`\n\x1b[32m  [✔] Tarama tamamlandı. Toplam zafiyet: ${ctx.issues.length}\x1b[0m`);
        console.log("  \x1b[36mDetaylar için: list | Rehber için: fix <id>\x1b[0m\n");
      }
      break;
    }

    // ──────── DOĞRUDAN RUN ────────
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
        console.log("\x1b[31m  Kullanım: run nmap <args> | run nmap full <target> | run zap <url> | run zap full <url>\x1b[0m");
      }
      break;

    // ──────── LOAD ────────
    case "load":
      if (args[0] === "nmap" && args[1]) {
        try {
          const { issues, nextId } = await parseNmapFile(args[1], ctx.nextId);
          ctx.issues.push(...issues);
          ctx.nextId = nextId;
          console.log(`\x1b[32m  ✔ Nmap raporu yüklendi. Eklenen zafiyet: ${issues.length}\x1b[0m`);
        } catch (e) {
          console.log(`\x1b[31m  ✘ Hata: ${e.message}\x1b[0m`);
        }
      } else if (args[0] === "zap" && args[1]) {
        try {
          const { issues, nextId } = parseZapFile(args[1], ctx.nextId);
          ctx.issues.push(...issues);
          ctx.nextId = nextId;
          console.log(`\x1b[32m  ✔ ZAP raporu yüklendi. Eklenen zafiyet: ${issues.length}\x1b[0m`);
        } catch (e) {
          console.log(`\x1b[31m  ✘ Hata: ${e.message}\x1b[0m`);
        }
      } else {
        console.log("\x1b[31m  Kullanım: load nmap <dosya.xml> | load zap <dosya.json>\x1b[0m");
      }
      break;

    // ──────── LİSTELEME ────────
    case "list": {
      let filterSeverity = null;
      if (args[0] && args[0].startsWith("sev=")) {
        filterSeverity = args[0].split("=")[1].toLowerCase();
      }

      let list = ctx.issues;
      if (filterSeverity) {
        list = list.filter(i => i.severity === filterSeverity);
      }

      // Severity'ye göre sırala (critical→info)
      list.sort((a, b) => (SEVERITY_ORDER[a.severity] || 99) - (SEVERITY_ORDER[b.severity] || 99));

      if (list.length === 0) {
        console.log("\x1b[33m  Gösterilecek zafiyet yok.\x1b[0m");
        break;
      }

      console.log(`\n\x1b[36m  ──── Zafiyet Listesi${filterSeverity ? " (Filtre: " + filterSeverity.toUpperCase() + ")" : ""} ────\x1b[0m\n`);

      list.forEach(i => {
        const sevLabel = colorSeverity(i.severity, `[${i.severity.toUpperCase().padEnd(8)}]`);
        const idLabel = `\x1b[37m#${String(i.id).padEnd(4)}\x1b[0m`;
        const loc = i.url || `${i.ip || i.host}:${i.port || ""}`;
        const srcLabel = `\x1b[90m(${i.source})\x1b[0m`;
        console.log(`  ${idLabel} ${sevLabel} ${srcLabel} ${loc}`);
        console.log(`       \x1b[37m${i.title}\x1b[0m`);
      });

      console.log(`\n  \x1b[36mToplam: ${list.length} zafiyet.\x1b[0m`);
      console.log("  \x1b[90mDetay için: detail <id> | Fix için: fix <id>\x1b[0m\n");
      break;
    }

    // ──────── ARAMA ────────
    case "search": {
      const keyword = args.join(" ").toLowerCase();
      if (!keyword) {
        console.log("\x1b[31m  Kullanım: search <anahtar kelime>\x1b[0m");
        break;
      }

      const results = ctx.issues.filter(i =>
        i.title.toLowerCase().includes(keyword) ||
        i.description.toLowerCase().includes(keyword) ||
        (i.cve && i.cve.toLowerCase().includes(keyword)) ||
        (i.fixKey && i.fixKey.toLowerCase().includes(keyword))
      );

      if (results.length === 0) {
        console.log(`\x1b[33m  "${keyword}" ile eşleşen zafiyet bulunamadı.\x1b[0m`);
        break;
      }

      console.log(`\n\x1b[36m  ──── Arama Sonuçları: "${keyword}" (${results.length} sonuç) ────\x1b[0m\n`);
      results.forEach(i => {
        const sevLabel = colorSeverity(i.severity, `[${i.severity.toUpperCase()}]`);
        console.log(`  \x1b[37m#${i.id}\x1b[0m ${sevLabel} ${i.title}`);
      });
      console.log("");
      break;
    }

    // ──────── DETAY ────────
    case "detail": {
      const id = parseInt(args[0], 10);
      if (isNaN(id)) {
        console.log("\x1b[31m  Kullanım: detail <id>\x1b[0m");
        break;
      }
      const issue = ctx.issues.find(i => i.id === id);
      if (!issue) {
        console.log("\x1b[31m  Bu ID'ye ait zafiyet bulunamadı.\x1b[0m");
        break;
      }
      printIssueDetail(issue);
      break;
    }

    // ──────── İSTATİSTİK ────────
    case "stats": {
      if (ctx.issues.length === 0) {
        console.log("\x1b[33m  Henüz tarama yapılmamış.\x1b[0m");
        break;
      }

      const counts = {};
      ctx.issues.forEach(i => {
        counts[i.severity] = (counts[i.severity] || 0) + 1;
      });

      console.log(`\n\x1b[36m  ──── Zafiyet İstatistikleri ────\x1b[0m\n`);

      const maxCount = Math.max(...Object.values(counts));
      const severityOrder = ["critical", "high", "medium", "low", "info"];

      severityOrder.forEach(sev => {
        const count = counts[sev] || 0;
        if (count === 0) return;
        const barLen = Math.round((count / maxCount) * 20);
        const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);
        console.log(`  ${colorSeverity(sev, sev.toUpperCase().padEnd(10))} ${bar} ${count}`);
      });

      console.log(`\n  \x1b[37mToplam: ${ctx.issues.length} zafiyet\x1b[0m`);

      // Kaynak bazlı dağılım
      const sources = {};
      ctx.issues.forEach(i => { sources[i.source] = (sources[i.source] || 0) + 1; });
      console.log(`\n  \x1b[36mKaynak Dağılımı:\x1b[0m`);
      Object.entries(sources).forEach(([src, cnt]) => {
        console.log(`    ${src.toUpperCase().padEnd(8)}: ${cnt}`);
      });
      console.log("");
      break;
    }

    // ──────── FIX ────────
    case "fix": {
      if (args[0] === "auto") {
        const id = parseInt(args[1], 10);
        if (isNaN(id)) {
          console.log("\x1b[31m  Kullanım: fix auto <id>\x1b[0m");
          break;
        }

        const issue = ctx.issues.find(i => i.id === id);
        if (!issue) {
          console.log("\x1b[31m  Bu ID'ye ait zafiyet bulunamadı.\x1b[0m");
          break;
        }

        if (!issue.fixKey || !FIX_GUIDES[issue.fixKey] || !FIX_GUIDES[issue.fixKey].autoFix) {
          console.log("\x1b[33m  Bu zafiyet için otomatik düzeltme (Auto-Fix) tanımlanmamış.\x1b[0m");
          console.log("  Lütfen `fix " + id + "` yazarak manuel çözüm adımlarını izleyin.");
          break;
        }

        const autoFixDef = FIX_GUIDES[issue.fixKey].autoFix;
        console.log(`\n\x1b[35m  [!] OTOMATİK DÜZELTME BAŞLATILACAK: \x1b[0m${autoFixDef.description}`);
        console.log(`  \x1b[31mUYARI: Sistem güvenlik duvarı veya servis yapılandırması değiştirilecek.\x1b[0m`);

        const ans = await askConfirmation("  Devam etmek istiyor musunuz? (E/H): ");
        if (ans.toLowerCase() === "e" || ans.toLowerCase() === "y") {
          console.log("\x1b[36m  [*] Düzeltme uygulanıyor...\x1b[0m");
          const result = applyAutoFix(autoFixDef);

          if (result.success) {
            console.log(`\x1b[32m  [✔] Otomatik düzeltme başarıyla uygulandı!\x1b[0m`);
            if (result.output && result.output.trim()) {
              console.log(`\x1b[90m  Çıktı:\n  ${result.output.trim()}\x1b[0m`);
            }
          } else {
            console.log(`\x1b[31m  [✘] Otomatik düzeltme başarısız oldu.\x1b[0m`);
            console.log(`  Hata Detayı: ${result.error}`);
            console.log(`  \x1b[33mLütfen yönetici/root ayrıcalıklarıyla çalıştırdığınızdan emin olun.\x1b[0m`);
          }
        } else {
          console.log("\x1b[33m  [*] İşlem iptal edildi.\x1b[0m");
        }
        break;
      }

      const id = parseInt(args[0], 10);
      if (isNaN(id)) {
        console.log("\x1b[31m  Kullanım: fix <id> veya fix auto <id>\x1b[0m");
        break;
      }
      const issue = ctx.issues.find(i => i.id === id);
      if (!issue) {
        console.log("\x1b[31m  Bu ID'ye ait zafiyet bulunamadı.\x1b[0m");
        break;
      }
      if (!issue.fixKey) {
        console.log("\x1b[33m  Bu zafiyet için fix rehberi tanımlanmamış.\x1b[0m");
        break;
      }
      printFixGuide(issue.fixKey);
      break;
    }

    // ──────── RAPOR ────────
    case "report": {
      if (ctx.issues.length === 0) {
        console.log("\x1b[33m  Rapor oluşturmak için önce tarama yapın.\x1b[0m");
        break;
      }

      console.log("\n\x1b[36m  [*] Raporlar oluşturuluyor...\x1b[0m");

      const txt = generateTxtReport(ctx.issues);
      console.log(`  \x1b[32m✔ TXT rapor:\x1b[0m ${txt}`);

      const html = generateHtmlReport(ctx.issues);
      console.log(`  \x1b[32m✔ HTML rapor:\x1b[0m ${html}`);

      const json = generateJsonReport(ctx.issues);
      console.log(`  \x1b[32m✔ JSON rapor:\x1b[0m ${json}`);

      console.log("\n\x1b[36m  [✔] Tüm raporlar reports/ klasöründe.\x1b[0m\n");
      break;
    }

    // ──────── EXPORT ────────
    case "export": {
      if (ctx.issues.length === 0) {
        console.log("\x1b[33m  Dışa aktarmak için önce tarama yapın.\x1b[0m");
        break;
      }

      const format = (args[0] || "").toLowerCase();
      const reportsDir = path.join(__dirname, "../reports");
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      if (format === "json") {
        const file = generateJsonReport(ctx.issues);
        console.log(`\x1b[32m  ✔ JSON dışa aktarıldı: ${file}\x1b[0m`);
      } else if (format === "csv") {
        let csv = "ID,Severity,Source,Title,Location,CVE,FixKey,Timestamp\n";
        ctx.issues.forEach(i => {
          const loc = i.url || `${i.ip}:${i.port}`;
          csv += `${i.id},"${i.severity}","${i.source}","${i.title.replace(/"/g, '""')}","${loc}","${i.cve || ""}","${i.fixKey || ""}","${i.timestamp}"\n`;
        });
        const file = path.join(reportsDir, "report.csv");
        fs.writeFileSync(file, csv);
        console.log(`\x1b[32m  ✔ CSV dışa aktarıldı: ${file}\x1b[0m`);
      } else {
        console.log("\x1b[31m  Kullanım: export json | export csv\x1b[0m");
      }
      break;
    }

    // ──────── ÇIKIŞ ────────
    case "exit":
    case "quit":
      console.log("\x1b[36m  Güle güle! 🛡️\x1b[0m");
      process.exit(0);

    default:
      console.log(`\x1b[31m  Bilinmeyen komut: '${cmd}'. 'help' yazarak komut listesini görebilirsiniz.\x1b[0m`);
      break;
  }
}

module.exports = {
  XasContext,
  handleCommand
};