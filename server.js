require('dotenv').config();
// 1. 라이브러리 및 모델 불러오기
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/user'); // 2단계에서 만든 User 모델

const app = express();
const PORT = 3000;

// 2. 미들웨어 설정
app.set('view engine', 'ejs'); // EJS를 템플릿 엔진으로 설정
app.use(express.static('public')); // CSS, JS 등 정적 파일을 담을 'public' 폴더 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET, // .env 파일의 변수 사용
  resave: false,
  saveUninitialized: true,
}));

// 3. MongoDB 연결
// 제공해주신 연결 문자열(uri)을 이곳에 붙여넣습니다.
// <db_password> 부분은 실제 비밀번호로 바꿔주세요.
mongoose.connect(process.env.MONGO_URI) // .env 파일의 변수 사용
  .then(() => console.log('MongoDB 연결 성공!'))
  .catch(err => console.log(err));

// 4. 라우팅 (경로) 설정

// 로그인 페이지 보여주기
app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});

// 로그인 처리
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });

  if (!user || user.password !== password) {
    return res.render('login', { message: '아이디 또는 비밀번호가 틀렸습니다.' });
  }

  // 로그인 성공 시, 세션에 사용자 정보 저장
  req.session.user = user;

  // 역할에 따라 다른 페이지로 이동
  if (user.role === 'master') {
    res.redirect('/master/dashboard');
  } else {
    res.redirect('/student/dashboard');
  }
});

// 학생 대시보드
app.get('/student/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.redirect('/login');
  }
  res.render('student_dashboard', { user: req.session.user });
});

// Master 대시보드
app.get('/master/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'master') {
    return res.redirect('/login');
  }
  const students = await User.find({ role: 'student' });
  res.render('master_dashboard', { students: students });
});

// Master가 숙제 업데이트
app.post('/master/update', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'master') {
    return res.redirect('/login');
  }

  // req.body.homeworks는 { '학생ID1': '숙제내용1', '학생ID2': '숙제내용2' } 형태가 됩니다.
  const { homeworks } = req.body; 

  for (const studentId in homeworks) {
    await User.findByIdAndUpdate(studentId, { homework: homeworks[studentId] });
  }

  res.redirect('/master/dashboard');
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// 기본 경로를 로그인 페이지로
app.get('/', (req, res) => {
  res.redirect('/login');
});


// 5. 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});