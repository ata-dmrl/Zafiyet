// src/autoFixer.js
const { execSync } = require("child_process");

function runCommand(command) {
    try {
        const output = execSync(command, { encoding: "utf8", stdio: "pipe" });
        return { success: true, output };
    } catch (e) {
        return { success: false, error: e.message || e.stderr || "Bilinmeyen Hata" };
    }
}

function applyAutoFix(autoFixDefinition) {
    const platform = process.platform;
    let command = null;

    if (platform === "win32" && autoFixDefinition.windows) {
        command = autoFixDefinition.windows;
    } else if ((platform === "linux" || platform === "darwin") && autoFixDefinition.linux) {
        command = autoFixDefinition.linux;
    }

    if (!command) {
        return {
            success: false,
            error: `Bu işletim sistemi (${platform}) için otomatik düzeltme komutu tanımlanmamış.`
        };
    }

    // Komut dizisi geldiyse (birden fazla komut)
    if (Array.isArray(command)) {
        let combinedOutput = "";
        for (const cmd of command) {
            const res = runCommand(cmd);
            if (!res.success) {
                return { success: false, error: `Komut başarısız oldu: ${cmd}\nHata: ${res.error}` };
            }
            combinedOutput += res.output + "\n";
        }
        return { success: true, output: combinedOutput };
    }

    // Tek komut geldiyse
    return runCommand(command);
}

module.exports = {
    applyAutoFix
};
