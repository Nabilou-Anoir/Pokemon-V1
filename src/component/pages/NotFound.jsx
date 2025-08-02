import { Link } from "react-router-dom"


export default function NotFound() {
  return (
    <div>
        <p className="text-4xl font-semibold text-center pt-10">Page Not found 🤖 </p>
    <div className="text-center">

        <Link to="/">
        Back to homepage
        </Link>
        
    </div>
    </div>
  )
}