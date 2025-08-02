import Search from "./component/Search";
import Navbar from "./component/Navbar";
import Accueil from "./component/pages/Accueil";
import PokedexList from "./component/pages/PokedexList";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import NotFound from "./component/pages/NotFound";

export default function App() {
  return (
   <>
 <div className="min-h-screen bg-purple-50 pt-20">
 <>
    <BrowserRouter>
   <Navbar/>
      <Routes>
        <Route path="/" element={<Accueil/>}/>
        <Route path="pokedexList" element={<PokedexList/>}/>
        <Route path="/search" element={<Search/>}/>    
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>

    </>
 </div>

  </> 
  )
}