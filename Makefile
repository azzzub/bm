deploy:
	git pull origin main
	pm2 stop 0
	pm2 remove 0
	pm2 node app.js