import { Link } from 'react-router-dom'
import { faHouse } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '../components/ui'

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-24 text-center">
      <p className="font-display text-8xl font-bold text-ink">4<span className="inline-block rounded-full bg-accent px-4 text-ink">0</span>4</p>
      <h1 className="text-h1 mt-4">찾을 수 없는 페이지예요</h1>
      <p className="text-body mt-2 text-muted">주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p>
      <Link to="/" className="btn btn-primary mt-6"><Icon icon={faHouse} />메인으로</Link>
    </div>
  )
}
