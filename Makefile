deploy:
	git pull origin main
	npm i
	pm2 stop 0
	pm2 delete 0
	pm2 start app.js
	pm2 save