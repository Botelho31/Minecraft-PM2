// Require Node.js standard library function to spawn a child process
var spawn = require("child_process").spawn;
const util = require("util");
const exec = util.promisify(require("child_process").exec);
var fs = require("fs");
const path = require("path");
// setup dotenv
const dotenv = require("dotenv");
dotenv.config();

const serverEnvPath = process.env.SERVER_PATH ?? "./server"
const serverPath = path.join(__dirname, serverEnvPath);
const memory = process.env.MEMORY ?? "1024M";
const port = process.env.PORT ?? 3000;
const minecraft_server_url =
  process.env.MINECRAFT_SERVER_URL ??
  "https://piston-data.mojang.com/v1/objects/5b868151bd02b41319f54c8d4061b8cae84e665c/server.jar";
const isMac = process.platform === "darwin";

// Create a child process for the Minecraft server using the same java process
// invocation we used manually before

async function setupServer() {
  const serverFolderExists = fs.existsSync(serverPath);
  const serverPathExists =
    serverFolderExists && fs.existsSync(`${serverPath}/server.jar`);
    const eulaExists = serverPathExists && fs.existsSync(`${serverPath}/eula.txt`);
  try {
    !serverFolderExists && (await exec(`mkdir ${serverPath}`));
    const downloadCommand = isMac
      ? `curl -o ${serverPath}/server.jar ${minecraft_server_url}`
      : `wget -O ${serverPath}/server.jar ${minecraft_server_url}`;
    !serverPathExists && console.log('Downloading Server.jar') && (await exec(downloadCommand));
    console.log("Server Downloaded");
    if (!eulaExists) await setupJava();
    setupEULA();
  } catch (err) {
    console.log(err);
    throw err
  }
}

function setupJava() {
  return new Promise(async function (resolve, reject) {
    try {
      var firstJavaExec = spawnMinecraftProcess()
      console.log("Java First Run Started");
      firstJavaExec.stdout.on("data", function (data) {
        log(data);
      });
      firstJavaExec.on("close", function (code) {
        log("Java First Run Completed");
        resolve();
      });
      firstJavaExec.stderr.on("error", function (err) {
        log(err);
        reject(err);
      });
    } catch (err) {
        console.log(err);
      reject(err);
    }
  });
}

function setupEULA() {
  fs.readFile(`${serverPath}/eula.txt`, "utf-8", function (err, data) {
    if (err) throw err;

    var newValue = data.replace(/false/gim, "true");

    fs.writeFile(`${serverPath}/eula.txt`, newValue, "utf-8", function (err) {
      if (err) throw err;
      console.log("Eula Setup Complete");
    });
  });
}

function log(data) {
  process.stdout.write(data.toString());
}

function spawnMinecraftProcess() {
    console.log("Starting Minecraft Server");
    return spawn(
        'java',
        [
          `-Xmx${memory}`,
          `-Xms${memory}`,
          "-jar",
          `${serverPath}/server.jar`,
          "nogui",
        ],
        {
          cwd: serverPath,
        }
      );
}

setupServer().then((data) => {
  var minecraftServerProcess = spawnMinecraftProcess()

  // Listen for events coming from the minecraft server process - in this case,
  // just log out messages coming from the server
  minecraftServerProcess.stdout.on("data", log);
  minecraftServerProcess.stderr.on("data", log);

  // Create an express web app that can parse HTTP POST requests
  var express = require("express");
  var app = express();
  app.use(
    require("body-parser").urlencoded({
      extended: false,
    })
  );
  app.use("/static", express.static(path.join(__dirname,"./public")));

  // Create a route that will respond to a POST request
  app.get("/command", function (request, response) {
    // Get the command from the HTTP request and send it to the Minecraft
    // server process
    console.log(request.query);
    var command = request.query["Body"];
    minecraftServerProcess.stdin.write(command + "\n");

    // buffer output for a quarter of a second, then reply to HTTP request
    var buffer = [];
    var collector = function (data) {
      data = data.toString();
      buffer.push(data.split("]: ")[1]);
    };
    minecraftServerProcess.stdout.on("data", collector);
    setTimeout(function () {
      minecraftServerProcess.stdout.removeListener("data", collector);
      response.send(buffer.join(""));
    }, 250);
  });

  app.get("/log", function (req, res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-control": "no-cache",
    });

    var str = "";
    minecraftServerProcess.stdout.on("data", function (data) {
      str += data.toString();

      // just so we can see the server is doing something
      // console.log("data");

      // Flush out line by line.
      var lines = str.split("\n");
      for (var i in lines) {
        if (i == lines.length - 1) {
          str = lines[i];
        } else {
          // Note: The double-newline is *required*
          res.write("data: " + lines[i] + "\n\n");
        }
      }
    });

    minecraftServerProcess.on("close", function (code) {
      res.end(str);
    });

    minecraftServerProcess.stderr.on("data", function (data) {
      res.end("stderr: " + data);
    });
  });

  app.get("/", function (request, response) {
    response.send("Minecraft Server");
  });

  // Listen for incoming HTTP requests on port 3000
  var server = app.listen(port);
  minecraftServerProcess.on("close", function (code) {
    console.log("Server Has Been Closed");
    server.close();
  });
});

process.on("SIGTERM", function () {
  console.log("SIGTERM");
  minecraftServerProcess.stdin.write("/stop\n");
  server.close();
});
