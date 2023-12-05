# /bin/bash

# add usb-storage.quirks=152d:0578:u to the beginning of the file /boot/cmdline.txt
echo "usb-storage.quirks=152d:0578:u " > temp.txt
cat /boot/cmdline.txt >> temp.txt
sudo mv temp.txt /boot/cmdline.txt
