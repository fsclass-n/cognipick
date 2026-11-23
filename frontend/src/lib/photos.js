// Unsplash License(무료·상업적 이용 가능) 사진을 WebP로 최적화해 /public/images 에 셀프 호스팅한다.
// 출처 표기는 의무가 아니지만 권장 사항이므로 데이터 출처 고지 페이지에 함께 표시한다.
const img = (name) => `/images/${name}.webp`

export const PHOTOS = {
  hero: img('hero'),
  login: img('login'),
  register: img('register'),
  business: img('business'),
  team: img('team-2'),
}

const BY_CATEGORY = {
  데이터: ['cat-data', 'cat-data2'],
  AI: ['cat-ai', 'learn-5'],
  프로그래밍: ['cat-programming', 'learn-4'],
  백엔드: ['cat-backend', 'learn-5'],
  프런트엔드: ['cat-frontend', 'learn-1'],
  인프라: ['cat-infra', 'cat-infra2'],
  협업: ['cat-collab', 'team-2', 'learn-3'],
  기타: ['learn-2', 'learn-3'],
}

// 기본 강의는 화면에서 사진이 겹치지 않도록 1:1 지정, 관리자가 추가한 강의는 카테고리별로 순환
const BY_COURSE = {
  1: 'cat-data2', 2: 'learn-4', 3: 'cat-data', 4: 'learn-2', 5: 'team-2', 6: 'cat-ai', 7: 'learn-5', 8: 'learn-1', 9: 'cat-backend',
  10: 'learn-3', 11: 'cat-infra', 12: 'cat-infra2', 13: 'cat-programming', 14: 'cat-frontend', 15: 'business', 16: 'hero', 17: 'cat-collab', 18: 'login',
}

export const coursePhoto = (category, id = 0) => {
  if (BY_COURSE[id]) return img(BY_COURSE[id])
  const list = BY_CATEGORY[category] || BY_CATEGORY.기타
  return img(list[id % list.length])
}

export const CREDITS = [
  ['hero, team-2, login', 'ThisisEngineering', 'https://unsplash.com/@thisisengineering'],
  ['register', 'Zoshua Colah', 'https://unsplash.com/photos/YmCYXU-7bCo'],
  ['business', 'Marvin Meyer', 'https://unsplash.com/photos/SYTO3xs06fU'],
  ['cat-data', 'Stephen Phillips - Hostreviews.co.uk', 'https://unsplash.com/photos/shr_Xn8S8QU'],
  ['cat-data2', 'Agence Olloweb', 'https://unsplash.com/photos/qfp4-Ud6Fyg'],
  ['cat-ai', 'Google DeepMind (Wes Cockx)', 'https://unsplash.com/photos/2ufXB-oAyG0'],
  ['cat-programming', 'Pankaj Patel', 'https://unsplash.com/photos/6JVlSdgMacE'],
  ['cat-backend', 'Markus Spiske', 'https://unsplash.com/photos/cvBBO4PzWPg'],
  ['cat-frontend', 'TourBox', 'https://unsplash.com/photos/BP-MMMDmie4'],
  ['cat-infra', 'imgix', 'https://unsplash.com/photos/pgdaAwf6IJg'],
  ['cat-infra2', 'Aaron McLean', 'https://unsplash.com/photos/pf7BliMKKxM'],
  ['cat-collab', 'Kaleidico', 'https://unsplash.com/photos/26MJGnCM0Wc'],
  ['learn-1', 'Daniel Thomas', 'https://unsplash.com/photos/6_NXEMZbUq0'],
  ['learn-2', 'Arnel Hasanovic', 'https://unsplash.com/photos/MNd-Rka1o0Q'],
  ['learn-3', 'Christin Hume', 'https://unsplash.com/photos/Hcfwew744z4'],
  ['learn-4', 'Moritz Kindler', 'https://unsplash.com/photos/YiX1jsdbWhY'],
  ['learn-5', 'Aristo Rinjuang', 'https://unsplash.com/photos/_As4NS0Twxs'],
]
