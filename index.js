const fs = require("fs");
const readline = require("readline");

const argv = process.argv.slice(2);
const sourceMapFileName = argv.shift();
const stacktraceFileName = argv.shift();

const androidBundleRegex = /index.android.bundle:\d+:\d+/;

function execShellCommand(cmd) {
  const exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout);
    });
  });
}

const symbolicate = async (stacktraceFileName, line, column) => {
  return await execShellCommand(
    `./node_modules/metro-symbolicate/src/index.js ${stacktraceFileName} ${line} ${column}`
  );
};

async function processStackTrace() {
  const fileStream = fs.createReadStream(stacktraceFileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const match = line.match(androidBundleRegex);
    if (match) {
      const [module, l, c] = match[0].split(":");
      const result = await symbolicate(sourceMapFileName, l, c);
      console.log(line.replace(androidBundleRegex, result.replace("\n", "")));
    } else {
      console.log(line);
    }
  }
}

processStackTrace();
