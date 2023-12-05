# /bin/bash

sudo apt update -y
sudo apt upgrade -y

# if nvm is not installed
if ! command -v nvm &> /dev/null
then
    echo "nvm could not be found"
    echo "installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash

    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

    nvm install node
fi

# if pm2 is not installed
if ! command -v pm2 &> /dev/null
then
    npm install pm2 -g

    pm2 completion install

    pm2 startup
fi

# if java is not installed
if ! command -v java &> /dev/null
then
    sudo apt install default-jdk -y
fi