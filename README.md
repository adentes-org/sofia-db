#SOFIA Database :

Use docker-compose to fired up the DB

## Setup
```
git clone https://github.com/adentes-org/sofia-db.git && cd sofia-db
#Edit docker-compose.yml to reflect your settings (For exemple your hostname)
```
## Start (with caddy for SSL termination)

```
docker-compose up -d
#Be aware that your ssl certificate auto-generated by caddy/letsencryt is located under caddy/data so be sure to keep it safe and backup 
```

## Start only db
```
docker-compose up -d couchdb
``` 
 
NB: docker-compose install  https://www.google.fr/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&cad=rja&uact=8&ved=0ahUKEwiSwazumdLLAhXD0hoKHU8NCJAQFggsMAE&url=https%3A%2F%2Fdocs.docker.com%2Fcompose%2Finstall%2F&usg=AFQjCNHYRp2Dlli1ZbdYel8gXaVdYwgwUw

If you need any dns name : http://nip.io/
