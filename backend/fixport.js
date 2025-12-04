// fixport.js
import { exec } from "child_process";
export function freePortAndRestart(port, startCmd = "npm run dev") {
  console.log(` بررسی پورت ${port}...`);
  
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (err || !stdout) {
      console.log("⛔ پورت در حال استفاده یافت نشد.");
      return;
    }

    const lines = stdout.trim().split("\n");
    const listeningLine = lines.find(l => l.includes("LISTENING")) || lines[0];
    const pid = listeningLine.trim().split(/\s+/).pop();

    if (!pid || isNaN(Number(pid))) {
      console.log("⛔ PID معتبر پیدا نشد.");
      return;
    }

    console.log(`AID: ${pid}`);
    exec(`\taskkill /PID ${pid} /F`, (killErr) => {
      if (killErr) {
        console.log("⛔ بستن پردازش ناموفق بود:", killErr.message);
        return;
      }
      console.log(`  پورت${port} آزاد شد. اجرای مجدد...`);
      exec(startCmd, (startErr, stdout2) => {
        if (startErr) {
          console.log("⛔ اجرای مجدد ناموفق بود:", startErr.message);
          return;
        }
        console.log("🚀 سرور دوباره راه‌اندازی شد:\n", stdout2);
      });
    });
  });
}