const { exec } = require("child_process");
const fs = require("fs");
const net = require("net");

const PORT = 6000;

function checkPort(port) {
  const server = net.createServer();
  server.once("error", err => {
    if (err.code === "EADDRINUSE") {
      console.log(`❌ پورت ${port} اشغال شده`);
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        const pid = stdout.trim().split(/\s+/).pop();
        console.log(`🛠 بستن پردازش با PID ${pid}`);
        exec(`taskkill /PID ${pid} /F`);
      });
    }
  });
  server.once("listening", () => {
    console.log(`✅ پورت ${port} آزاد است`);
    server.close();
  });
  server.listen(port);
}

function checkMongo() {
  exec(`mongo --eval "db.runCommand({ ping: 1 })"`, (err, stdout) => {
    if (stdout && stdout.includes('"ok" : 1')) {
      console.log("✅ اتصال به MongoDB برقرار است");
    } else {
      console.log("❌ MongoDB در دسترس نیست");
    }
  });
}

function checkPackageJson() {
  try {
    const data = fs.readFileSync("package.json", "utf8");
    JSON.parse(data);
    console.log("✅ فایل package.json سالم است");
  } catch (err) {
    console.log("❌ فایل package.json خراب است");
  }
}

function runProject() {
  exec("npm run dev", (err, stdout, stderr) => {
    if (stdout && stdout.includes("Server started")) {
      console.log("✅ پروژه با موفقیت اجرا شد");
    } else {
      console.log("❌ اجرای پروژه با خطا مواجه شد");
      console.log(stderr);
    }
  });
}

checkPort(PORT);
checkMongo();
checkPackageJson();
setTimeout(runProject, 3000);