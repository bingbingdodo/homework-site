const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 실제 프로젝트에서는 비밀번호를 암호화해서 저장해야 합니다.
  role: { type: String, enum: ['student', 'master'], required: true },
  homework: { type: String, default: '이번 주 숙제가 아직 없습니다.' } // 학생에게만 적용되는 필드
});

const User = mongoose.model('User', userSchema);

module.exports = User;