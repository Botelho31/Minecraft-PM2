# /bin/bash

echo "Updating and upgrading..."
sudo apt update -y
sudo apt upgrade -y
echo "Done updating and upgrading"

echo "Installing nvm..."
# if nvm is not installed
if ! command -v nvm &> /dev/null
then
    echo "nvm could not be found"
    echo "installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash

    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

    nvm install v21.4.0
fi
echo "Done installing nvm"

echo "Installing java..."
# if java is not installed
if ! command -v java &> /dev/null
then
    sudo apt install default-jdk -y
fi
echo "Done installing java"

echo "Installing node..."
# if pm2 is not installed
if ! command -v pm2 &> /dev/null
then
    npm install pm2 -g

    pm2 completion install

    pm2 startup

    sudo env PATH=$PATH:/home/pi/.nvm/versions/node/v21.4.0/bin /home/pi/.nvm/versions/node/v21.4.0/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
fi
echo "Done installing node"