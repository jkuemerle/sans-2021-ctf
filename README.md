# Everyone Can Play! Building Great CTFs for Non-Security Folks #
## SANS Security Awareness 2021 by [@jkuemerle](https://twitter.com/jkuemerle) ##

Materials and references for SANS Security Awareness Summit 2021 talk "Everyone Can Play!"

Hands on activites require local Docker and/or free [Heroku](https://www.heroku.com) account. Local execution of utility scripts requires [Node.JS](https://nodejs.org/).

To perform command line configuration of Heroku install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

To use the activities, clone the this repository and the below repositories. If you will be working using local Docker you can build both the CTFd Docker Compose definition and the OWASP Juice Shop Docker image.

For the report building any basic reporting tool will work. The workshop will use a custom version of the [Elasticsearch, Logstash, Kibana (ELK) Docker Image](https://github.com/jkuemerle/elk-docker).

## Repositories ##

### CTFd ###
Customized, Heroku ready version of CTFd: [https://github.com/jkuemerle/CTFd-SANS2021](https://github.com/jkuemerle/CTFd-SANS2021)

### OWASP Juice Shop ###
Customized, Heroku ready version of OWASP Juice Shop: [https://github.com/jkuemerle/juice-shop-sans-2021](https://github.com/jkuemerle/juice-shop-sans-2021)

## Reporting ##
Customized ELK: [https://github.com/jkuemerle/elk-docker](https://github.com/jkuemerle/elk-docker)

## Self Provision ##
Utility for self provisioning: [https://github.com/jkuemerle/sans-ctf-provision](https://github.com/jkuemerle/sans-ctf-provision)

### Utility Scripts ###
Are located in the [scripts](scripts) folder.

#### Juice Shop Challenge Extractor ####

Extracts challenges from a running Juice Shop instance.
```
npm install -g juice-shop-ctf-cli
juice-shop-ctf
```

* CTF framework: CTFd
* Juice Shop URL: https://sans-ctf.herokuapp.com/ 
* Secret key: https://raw.githubusercontent.com/jkuemerle/juice-shop-sans-2021/main/ctf.key
* Paid text hints
* No hint URLs

Unzip file to the events\fromJuiceShop subdirectory.

#### JSON to YAML Converter ####
Converts exported Juice Shop CTFd data (Challenges/Flags/Hints) to YAML file.

From scripts folder
```
node yfromjs.js -c "..\events\fromJuiceShop\db\challenges.json" -f "..\events\fromJuiceShop\db\flags.json" -h "..\events\fromJuiceShop\db\hints.json" -o "..\events\SANS2021\challenges.yml"
```

#### YAML to Challenge Converter ####

Converts YAML document to Challenges/Flags/Hints and updates any Pages

From scripts folder
```
node ctfdFromYaml.js -o "..\events\SANS2021" -p "..\events\SANS2021\pages" -f "..\events\SANS2021"
```

#### Create Event Zip File ####

Creates an event specific zip file for an instance.

From scripts folder
```
node createExport.js -i "..\events\SANS2021" -o "..\events\SANS2021\export.zip"
```

Copy the export.zip repository to the correct CTFd *eventdata* subdirectory.

#### Create Event CTFd archive for self provision ####
From scripts folder
```
node buildCTFdArchive.js -o "..\..\sans-ctf-provision\public\ctfd.tar.gz" -i "..\..\sans-ctfd-work"
```

#### Create JuiceShop arhcive for self provision ####
From scripts folder
```
node buildCTFdArchive.js -o "..\..\sans-ctf-provision\public\juiceshop.tar.gz" -i "..\..\sans-juice-shop"
```

#### Build Script ####

Builds the CTFd instance.


### Integrated Challenge ###

Custom integrated challenge plugin for CTFd [https://github.com/salesforce/integrated_challenge](https://github.com/salesforce/integrated_challenge)


## Instructions ##

Create Heroku application for CTFd: 
```
heroku apps:create <app name>
```

Change application stack to container 
````
heroku stack:set container
````

## Reporting ##
Kibana: http://localhost:5601/app/kibana

Google sheets, import CSVs, delete id & team_id column from Solves and Solutions

