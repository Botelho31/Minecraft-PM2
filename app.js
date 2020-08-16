// Require Node.js standard library function to spawn a child process
var spawn = require('child_process').spawn;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs');

// Create a child process for the Minecraft server using the same java process
// invocation we used manually before

async function setupServer(){
    return new Promise(
        async function(resolve, reject) { 
            if(!fs.existsSync("./server")){
                try{
                    await exec('mkdir server')
                    await exec('wget -O server/minecraft_server.jar https://launcher.mojang.com/v1/objects/a412fd69db1f81db3f511c1463fd304675244077/server.jar');
                    await setupJava()
                    await setupEULA()
                    resolve()
                }catch(err){
                    console.log(err)
                    reject()
                }
            }else{
                resolve()
            }
        })
}

function setupJava(){
    return new Promise(
        async function(resolve, reject) { 
            try {
                var firstJavaExec = spawn('java', [
                    '-Xmx512M',
                    '-Xms256M',
                    '-jar',
                    'minecraft_server.jar',
                    'nogui'
                ],{
                    cwd : "server"
                });
                firstJavaExec.stdout.on('data',function (data) {
                    log(data);
                });
                firstJavaExec.on('close', function (code) {
                    console.log("Java First Run Completed")
                    resolve()
                });
                firstJavaExec.stderr.on('error', function (err) {
                    log(err);
                    reject(err)
                });
            } catch (err) {
                reject(err)
            }
        })
}

function setupEULA() {
  fs.readFile('server/eula.txt', 'utf-8', function(err, data){
    if (err) throw err;

    var newValue = data.replace(/false/gim, 'true');

    fs.writeFile('server/eula.txt', newValue, 'utf-8', function (err) {
      if (err) throw err;
      console.log('Eula Setup Complete');
    });
  });
}

function log(data) {
    process.stdout.write(data.toString());
}

setupServer().then(data => {
    var minecraftServerProcess = spawn('java', [
        '-Xmx1024M',
        '-Xms1024M',
        '-jar',
        'minecraft_server.jar',
        'nogui'
    ],{
        cwd : "server"
    });
    
    // Listen for events coming from the minecraft server process - in this case,
    // just log out messages coming from the server
    minecraftServerProcess.stdout.on('data', log);
    minecraftServerProcess.stderr.on('data', log);
    
    // Create an express web app that can parse HTTP POST requests
    var express = require('express')
    var app = express();
    app.use(require('body-parser').urlencoded({
        extended:false
    }));
    app.use('/static', express.static(__dirname + '/public'));
    
    // Create a route that will respond to a POST request
    app.get('/command', function(request, response) {
        // Get the command from the HTTP request and send it to the Minecraft
        // server process
        console.log(request.query);
        var command = request.query["Body"];
        minecraftServerProcess.stdin.write(command+'\n');
    
        // buffer output for a quarter of a second, then reply to HTTP request
        var buffer = [];
        var collector = function(data) {
            data = data.toString();
            buffer.push(data.split(']: ')[1]);
        };
        minecraftServerProcess.stdout.on('data', collector);
        setTimeout(function() {
            minecraftServerProcess.stdout.removeListener('data', collector);
            response.send(buffer.join(''));
        }, 250);
    });

    app.get('/log', function(req, res){
        res.writeHead(200, { "Content-Type": "text/event-stream",
                             "Cache-control": "no-cache" });
    
        var str = ""
        minecraftServerProcess.stdout.on('data', function (data) {
            str += data.toString();
    
            // just so we can see the server is doing something
            // console.log("data");
    
            // Flush out line by line.
            var lines = str.split("\n");
            for(var i in lines) {
                if(i == lines.length - 1) {
                    str = lines[i];
                } else{
                    // Note: The double-newline is *required*
                    res.write('data: ' + lines[i] + "\n\n");
                }
            }
        });
    
        minecraftServerProcess.on('close', function (code) {
            res.end(str);
        });
    
        minecraftServerProcess.stderr.on('data', function (data) {
            res.end('stderr: ' + data);
        });
    });
    
    app.get('/', function(request, response) {
        response.send('Minecraft Server')
    });
    
    // Listen for incoming HTTP requests on port 3000
    var server = app.listen(3002);
    minecraftServerProcess.on('close', function (code) {
        console.log("Server Has Been Closed")
        server.close()
    });
})
