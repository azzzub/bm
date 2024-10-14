deploy:
	git pull origin main
	pm2 stop 0
	pm2 delete 0
	pm2 start app.js
	pm2 save