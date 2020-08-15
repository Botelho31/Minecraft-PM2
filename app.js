// Require Node.js standard library function to spawn a child process
var spawn = require('child_process').spawn;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs');

// Create a child process for the Minecraft server using the same java process
// invocation we used manually before

async function setupServer(){

    if(process.env.SETUPSERVER == "false"){
        try{
            await exec('mkdir server')
            await exec('wget -O server/minecraft_server.jar https://launcher.mojang.com/v1/objects/a412fd69db1f81db3f511c1463fd304675244077/server.jar')
            await setupJava()
            await setupEULA()
        }catch(err){
            console.log(err)
        }
        // You need to agree to the EULA in order to run the server. Go to eula.txt for more info.
        process.env.SETUPSERVER = "true"
    }

    var minecraftServerProcess = spawn('java', [
        '-Xmx512M',
        '-Xms256M',
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
    var app = require('express')();
    app.use(require('body-parser').urlencoded({
        extended:false
    }));

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

    // Listen for incoming HTTP requests on port 3000
    app.listen(3000);
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
                    console.log("Java first Run Completed")
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

setupServer()
