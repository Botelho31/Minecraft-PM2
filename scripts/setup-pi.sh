# /bin/bash

# add usb-storage.quirks=152d:0578:u to the beginning of the file /boot/cmdline.txt
echo "usb-storage.quirks=152d:0578:u " > temp.txt
cat /boot/cmdline.txt >> temp.txt
sudo mv temp.txt /boot/cmdline.txt

sudo echo `
interface eth0
static ip_address=192.168.0.9/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8

interface wlan0
static ip_address=192.168.0.9/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8` >> /etc/dhcpcd.conf

sudo echo "
network={
        ssid="RALU_NET_5G"
        psk=0815233128
        psk_mgmt=WPA-PSK
}" >> /etc/wpa_supplicant/wpa_supplicant.conf