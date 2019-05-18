# Line bot to google photos

This application is a bot which can handle images/movies from LINE and transfer them to Google photos

# Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# You should set

You should set some environments variables before you run it.

LINE's long time token
```
LINE_ACCESS_TOKEN
```

LINE's channnel secret
```
LINE_CHANNEL_SECRET
```


Your google photos url
```
GOOGLE_PHOTO_URL
```

Your google photos album id

```
ALBUM_ID
```
and you can check your album id like this

```
curl -s -H "Authorization: Bearer XXXXX" https://photoslibrary.googleapis.com/v1/albums
```

Google photos' refresh token. This application use it to get access token for Google photos
You can get CLIENT_ID and CLIENT_SECRET from google developers console.

```
REFRESH_TOKEN
CLIENT_ID
CLIENT_SECRET
```