# /bin/bash

# add usb-storage.quirks=152d:0578:u to the beginning of the file /boot/cmdline.txt

# check if the line is already there

echo "Configuring SSD..."
if grep -q "usb-storage.quirks=152d:0578:u" /boot/cmdline.txt; then
    echo "usb-storage.quirks=152d:0578:u is already in the file"
else
    echo "usb-storage.quirks=152d:0578:u is not in the file"
    echo -n "usb-storage.quirks=152d:0578:u " > temp.txt
    cat /boot/cmdline.txt >> temp.txt
    sudo mv temp.txt /boot/cmdline.txt
fi
echo "Done configuring SSD"

# check if the line is already there

echo "Configuring static ip and wifi..."
if grep -q "192.168.0.9/24" /etc/dhcpcd.conf; then
    echo "The static ip is already in the file"
else
    echo "The static ip is not in the file"
        # Append the necessary configuration to /etc/dhcpcd.conf
    sudo bash -c 'cat <<EOT >> /etc/dhcpcd.conf
interface eth0
static ip_address=192.168.0.9/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8

interface wlan0
static ip_address=192.168.0.9/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8
EOT'
fi

if grep -q "RALU_NET_5G" /etc/wpa_supplicant/wpa_supplicant.conf; then
    echo "The wifi is already in the file"
else
    echo "The wifi is not in the file"
    sudo bash -c 'cat <<EOT >> /etc/wpa_supplicant/wpa_supplicant.conf
network={
    ssid="RALU_NET_5G"
    psk="0815233128"
    key_mgmt=WPA-PSK
}

network={
    ssid="RALU NET 2G"
    psk="0815233128"
    key_mgmt=WPA-PSK
}
EOT'
fi
echo "Done configuring static ip and wifi"