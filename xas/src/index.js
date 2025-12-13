// src/index.js
const { banner } = require("./banner");
const readline = require("readline");
const { XasContext, handleCommand } = require("./commands");
banner();
function startRepl() {
  const ctx = new XasContext();

  console.log("XAS Security Console (Node.js)");
  console.log("Type 'help' for commands.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "xas> "
  });

  rl.prompt();

  rl.on("line", async line => {
    try {
      await handleCommand(ctx, line);
    } catch (e) {
      console.log("Beklenmeyen hata:", e.message);
    }
    rl.prompt();
  });
}

startRepl();