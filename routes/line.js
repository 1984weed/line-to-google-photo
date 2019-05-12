const express = require('express')
const https = require('https')
const router = express.Router()
const line = require('@line/bot-sdk');

const albumId = process.env.ALBUM_ID
const googlePhotoUrl = process.env.GOOGLE_PHOTO_URL
const config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

router.post('/callback', async function(req, res, next) {
    let token
    try {
        token = await getGoogleAccessToken()
    } catch (e) {
        console.log('Get token fails: ', e)
        return
    }
    const { events } = req.body
    console.log(JSON.stringify(events))
    const uploadTokens = []
    for (const e of events) {
        const { type, id } = e.message
        if(type === 'join') {
            return;
        }
        if (type === 'image' || type === 'video') {
            console.log(id)
            let image
            try {
                image = await getImage(id, config.channelAccessToken)
            } catch (e) {
                console.log('Fails to get image from line: ', e)
                break
            }
            try {
                const uploadToken = await uploadImageToGooglePhotos(
                    image,
                    token,
                    id,
                    getExtenstionFromType(type)
                )
                uploadTokens.push(uploadToken)
            } catch (e) {
                console.log('Fails to upload an image to Google photo: ', e)
            }
        }
    }

    const { replyToken, source } = events[0];

    if(uploadTokens.length === 0) {
        console.log('No image')
        await replyMessage(replyToken, "画像を送ってね。")
        return 
    }

    try {
        await addImagesToAlbum(albumId, uploadTokens, token)
        await replyMessage(replyToken, `画像が登録されました。\n ${googlePhotoUrl}`)
        res.json({ success: 'ok' })
    } catch (e) {
        console.log('Fails to regist to the album in Goolge photos', e)
        return
    }
})

function replyMessage(replyToken, text) {
    return client.replyMessage(replyToken, { type: "text", text });
}

function getExtenstionFromType(type) {
    if (type === 'image') {
        return 'jpg'
    }
    return 'mp4'
}

function getImage(messageId, token) {
    return new Promise((resolve, reject) => {
        // Request Headers
        const send_options = {
            host: 'api.line.me',
            path: `/v2/bot/message/${messageId}/content`,
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                Authorization: ` Bearer ${token}`,
            },
            method: 'GET',
        }

        const req = https.request(send_options, function(res) {
            var data = []
            res.on('data', function(chunk) {
                data[data.length] = chunk
            })
                .on('error', function(err) {
                    console.log(err)
                    reject(err)
                })
                .on('end', function() {
                    resolve(Buffer.concat(data))
                })
        })
        req.end()
    })
}
const { REFRESH_TOKEN, CLIENT_ID, CLIENT_SECRET } = process.env

function getGoogleAccessToken() {
    return new Promise((resolve, reject) => {
        const send_options = {
            host: 'www.googleapis.com',
            path: `/oauth2/v4/token?refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token`,
            method: 'POST',
        }

        const req = https.request(send_options, function(res) {
            var data = []
            res.on('data', function(chunk) {
                data.push(new Buffer(chunk))
            })
                .on('error', function(err) {
                    reject(err)
                })
                .on('end', function() {
                    const resData = JSON.parse(data)
                    if (resData != null) {
                        resolve(resData.access_token)
                    }
                })
        })
        req.end()
    })
}

function uploadImageToGooglePhotos(image, token, id, extention) {
    return new Promise((resolve, reject) => {
        const send_options = {
            host: 'photoslibrary.googleapis.com',
            path: '/v1/uploads',
            method: 'POST',
            encoding: null,
            headers: {
                'Content-type': 'application/octet-stream',
                'Content-Length': image.length,
                'X-Goog-Upload-File-Name': `${id}.${extention}`,
                'X-Goog-Upload-Protocol': 'raw',
                Authorization: `Bearer ${token}`,
            },
        }

        const req = https.request(send_options, function(res) {
            var data = []
            res.on('data', function(chunk) {
                data.push(new Buffer(chunk))
            })
                .on('error', function(err) {
                    reject(err)
                })
                .on('end', function() {
                    if (data != null) {
                        resolve(data.toString())
                    }

                    reject('Empty return for upload an image to photos')
                })
        })
        req.write(image)
        req.end()
    })
}

function addImagesToAlbum(albumToken, imageTokens, token) {
    return new Promise((resolve, reject) => {
        const newMediaItems = imageTokens.map(a => {
            return {
                description: '',
                simpleMediaItem: {
                    uploadToken: a,
                },
            }
        })
        const json = {
            albumId: albumToken,
            newMediaItems: newMediaItems,
        }
        const jsonStr = JSON.stringify(json)
        const send_options = {
            host: 'photoslibrary.googleapis.com',
            path: '/v1/mediaItems:batchCreate',
            method: 'POST',
            headers: {
                'Content-Length': jsonStr.length,
                'Content-type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }

        const req = https.request(send_options, function(res) {
            var data = []
            res.on('data', function(chunk) {
                data.push(new Buffer(chunk))
            })
                .on('error', function(err) {
                    console.log(err)
                    reject(err)
                })
                .on('end', function() {
                    resolve('ok')
                })
        })
        req.write(jsonStr)
        req.end()
    })
}

module.exports = router
