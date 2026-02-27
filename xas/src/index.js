// src/index.js
const { banner } = require("./banner");
const readline = require("readline");
const { XasContext, handleCommand } = require("./commands");
const { checkAllTools } = require("./toolCheck");

banner();
checkAllTools();

function startRepl() {
  const ctx = new XasContext();

  console.log("\n\x1b[1m\x1b[36mXAS Security Console\x1b[0m \x1b[90mv2.0.0\x1b[0m");
  console.log("\x1b[90mKomutlar için 'help' yazın.\x1b[0m\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\x1b[36mxas\x1b[0m\x1b[33m>\x1b[0m ",
    completer: (line) => {
      const commands = [
        "help", "tools", "clear", "exit", "quit",
        "scan", "scan full",
        "run nmap", "run nmap full", "run zap", "run zap full",
        "load nmap", "load zap",
        "list", "list sev=critical", "list sev=high", "list sev=medium", "list sev=low", "list sev=info",
        "search", "detail", "fix", "stats",
        "report", "export json", "export csv"
      ];
      const hits = commands.filter(c => c.startsWith(line.trim()));
      return [hits.length ? hits : commands, line];
    }
  });

  rl.prompt();

  rl.on("line", async line => {
    try {
      await handleCommand(ctx, line);
    } catch (e) {
      console.log("\x1b[31m  Beklenmeyen hata:\x1b[0m", e.message);
    }
    rl.prompt();
  });
}

startRepl();