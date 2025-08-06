const kakaoLoginButton = document.querySelector('#kakao');
const naverLoginButton = document.querySelector('#naver');
const googleLoginButton = document.querySelector('#google');
const userImage = document.querySelector('img');
const userName = document.querySelector('#user_name');
const logoutButton = document.querySelector('#logout_button');

let currentOAuthService = '';

const kakaoClientId = window._CONFIG.KAKAO_CLIENT_ID;
const redirectURI = window._CONFIG.REDIRECT_URI;

const googleClientId = window._CONFIG.GOOGLE_CLIENT_ID;

const naverClientId = window._CONFIG.NAVER_CLIENT_ID;
const naverClientSecret = window._CONFIG.NAVER_CLIENT_SECRET;
const naverSecret = window._CONFIG.NAVER_SECRET;

let kakaoAccessToken = '';
let naverAccessToken = '';

function renderUserInfo(imgURL, name) {
  userImage.src = imgURL;
  userName.textContent = name;
}

function generateState(service) {
  return `${service}_${Date.now()}`;
}

kakaoLoginButton.onclick = () => {
  const state = generateState('kakao');
  localStorage.setItem('oauth_state', state);
  location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectURI}&response_type=code&state=${state}`;
};

naverLoginButton.onclick = () => {
  const state = generateState('naver');
  localStorage.setItem('oauth_state', state);
  location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}&response_type=code&redirect_uri=${redirectURI}&state=${state}`;
};

googleLoginButton.onclick = () => {
  const state = generateState('google');
  localStorage.setItem('oauth_state', state);
  const scope = 'profile email';
  location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectURI}&response_type=code&scope=${scope}&access_type=offline&state=${state}`;
};

window.onload = () => {
  const url = new URL(location.href);
  const authorizationCode = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const savedState = localStorage.getItem('oauth_state');

  if (!authorizationCode) return;

  if (!returnedState || returnedState !== savedState) {
    console.error('State 값 불일치');
    return;
  }

  if (returnedState.startsWith('naver_')) {
    // 네이버 로그인
    axios
      .post('http://localhost:3000/naver/login', { authorizationCode })
      .then((res) => {
        naverAccessToken = res.data;
        return axios.post('http://localhost:3000/naver/userinfo', {
          naverAccessToken,
        });
      })
      .then((res) => {
        renderUserInfo(res.data.profile_image, res.data.name);
        currentOAuthService = 'naver';
      })
      .catch((err) => {
        console.error('네이버 로그인 에러:', err);
      });
  } else if (returnedState.startsWith('google_')) {
    // 구글 로그인
    axios
      .post('http://localhost:3000/google/login', { authorizationCode })
      .then((res) => {
        const googleAccessToken = res.data;
        return axios.post('http://localhost:3000/google/userinfo', {
          googleAccessToken,
        });
      })
      .then((res) => {
        renderUserInfo(res.data.picture, res.data.name);
        currentOAuthService = 'google';
      })
      .catch((err) => {
        console.error('구글 로그인 에러:', err);
      });
  } else if (returnedState.startsWith('kakao_')) {
    // 카카오 로그인
    axios
      .post('http://localhost:3000/kakao/login', { authorizationCode })
      .then((res) => {
        kakaoAccessToken = res.data;
        return axios.post('http://localhost:3000/kakao/userinfo', {
          kakaoAccessToken,
        });
      })
      .then((res) => {
        renderUserInfo(res.data.profile_image, res.data.nickname);
        currentOAuthService = 'kakao';
      })
      .catch((err) => {
        console.error('카카오 로그인 에러:', err);
      });
  } else {
    console.error('알 수 없는 OAuth 서비스');
  }

  localStorage.removeItem('oauth_state');
};

logoutButton.onclick = () => {
  if (currentOAuthService === 'kakao') {
    axios
      .delete('http://localhost:3000/kakao/logout', {
        data: { kakaoAccessToken },
      })
      .then((res) => {
        renderUserInfo('', '');
        currentOAuthService = '';
      });
  } else if (currentOAuthService === 'naver') {
    axios
      .delete('http://localhost:3000/naver/logout', {
        data: { naverAccessToken },
      })
      .then((res) => {
        renderUserInfo('', '');
        currentOAuthService = '';
      });
  } else if (currentOAuthService === 'google') {
    renderUserInfo('', '');
    currentOAuthService = '';
    console.log('구글 로그아웃 (세션만 초기화)');
  }
};
