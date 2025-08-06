const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const kakaoClientId = process.env.KAKAO_CLIENT_ID;
const redirectURI = process.env.REDIRECT_URI;

const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
const naverSecret = process.env.NAVER_SECRET;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['OPTIONS', 'POST', 'DELETE'],
  })
);

app.use(express.json());

app.post('/kakao/login', (req, res) => {
  const authorizationCode = req.body.authorizationCode;
  axios
    .post(
      'https://kauth.kakao.com/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        client_id: kakaoClientId,
        redirect_uri: redirectURI,
        code: authorizationCode,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      }
    )
    .then((response) => res.send(response.data.access_token))
    .catch((err) => {
      console.error('Kakao Login Error:', err.response?.data || err.message);
      res.status(500).send('Kakao Login Failed');
    });
});

app.post('/naver/login', (req, res) => {
  const authorizationCode = req.body.authorizationCode;
  axios
    .post(
      `https://nid.naver.com/oauth2.0/token?client_id=${naverClientId}&client_secret=${naverClientSecret}&grant_type=authorization_code&state=${naverSecret}&code=${authorizationCode}`
    )
    .then((response) => res.send(response.data.access_token))
    .catch((err) => {
      console.error('Naver Login Error:', err.response?.data || err.message);
      res.status(500).send('Naver Login Failed');
    });
});

app.post('/google/login', (req, res) => {
  const authorizationCode = req.body.authorizationCode;

  const data = qs.stringify({
    code: authorizationCode,
    client_id: googleClientId,
    client_secret: googleClientSecret,
    redirect_uri: redirectURI,
    grant_type: 'authorization_code',
  });

  axios
    .post('https://oauth2.googleapis.com/token', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((response) => res.send(response.data.access_token))
    .catch((error) => {
      console.error('Google Login Error:', error.response?.data || error.message);
      res.status(500).send('Google Login Failed');
    });
});

app.post('/kakao/userinfo', (req, res) => {
  const { kakaoAccessToken } = req.body;
  axios
    .get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    })
    .then((response) => res.json(response.data.properties))
    .catch((err) => {
      console.error('Kakao UserInfo Error:', err.response?.data || err.message);
      res.status(500).send('Kakao UserInfo Failed');
    });
});

app.post('/naver/userinfo', (req, res) => {
  const { naverAccessToken } = req.body;
  axios
    .get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${naverAccessToken}`,
      },
    })
    .then((response) => res.json(response.data.response))
    .catch((err) => {
      console.error('Naver UserInfo Error:', err.response?.data || err.message);
      res.status(500).send('Naver UserInfo Failed');
    });
});

app.post('/google/userinfo', (req, res) => {
  const { googleAccessToken } = req.body;
  axios
    .get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
      },
    })
    .then((response) => res.json(response.data))
    .catch((error) => {
      console.error('Google UserInfo Error:', error.response?.data || error.message);
      res.status(500).send('Google User Info Failed');
    });
});

app.delete('/kakao/logout', (req, res) => {
  const { kakaoAccessToken } = req.body;
  axios
    .post(
      'https://kapi.kakao.com/v1/user/logout',
      {},
      {
        headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      }
    )
    .then((response) => res.send('로그아웃 성공'))
    .catch((err) => {
      console.error('Kakao Logout Error:', err.response?.data || err.message);
      res.status(500).send('Kakao Logout Failed');
    });
});

app.delete('/naver/logout', (req, res) => {
  const { naverAccessToken } = req.body;
  axios
    .post(
      `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${naverClientId}&client_secret=${naverClientSecret}&access_token=${naverAccessToken}&service_provider=NAVER`
    )
    .then((response) => res.send('로그아웃 성공'))
    .catch((err) => {
      console.error('Naver Logout Error:', err.response?.data || err.message);
      res.status(500).send('Naver Logout Failed');
    });
});

app.listen(3000, () => console.log('서버 열림!'));
