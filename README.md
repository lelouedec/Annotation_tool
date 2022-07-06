# 3D Annotation Tool

# Installation
The tool requires the Apache server.

## Ubuntu
To install the Apache server issue:
```
sudo apt update
sudo apt install apache2
```
- then open `http://localhost/` in the browser and you should see a site with the "It works!" message and some additional information.


## Windows
The easiest way to install the server on Windows is to:
 - download the binaries from [Apache Lounge](https://www.apachelounge.com/download/) and then:
 - extract all files to `C:\Apache24`;
 - run `C:\Apache24\bin\httpd.exe`;
 - open `http://localhost/` in the browser and you should see a site with the "It works!" message.

The default location for the website is in `C:\Apache24\htdocs`. You can either copy all the files from this repository to that folder or (better) change the server configuration file and point to your custom local directory. To do so:
 - make a backup copy of the `C:\Apache24\conf\httpd.conf` file;
 - change the following lines from:
```
DocumentRoot "${SRVROOT}/htdocs"
<Directory "${SRVROOT}/htdocs">
```
to point at your custom folder location (e.g. `E:/code/Annotation_tool`):

```
DocumentRoot "E:/code/Annotation_tool"
<Directory "E:/code/Annotation_tool">
```
- restart the server and after opening `http://localhost/` the annotation tool should launch.

The above procedure requires manual startup of the server each time you want to work with the tool. An automated start-up will be covered soon.
