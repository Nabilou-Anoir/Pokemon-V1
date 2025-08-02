import { useState } from "react"
import hamburger from "../assets/hamburger.svg"
import close from "../assets/close.svg"
import { NavLink,Link } from "react-router-dom"

export default function Navbar() {

  const [showMenu,setShowMenu]=useState(true)

  return (
  <nav className="fixed top-0 w-full flex justify-center p-4 bg-slate-200">
    <p className="text-xl font-bold">PokAPI</p>
    <ul className={`${showMenu ? "flex" : "hidden"} sm:flex flex-col items-center bg-slate-200 w-full
    absolute top-full pb-5 sm:relative sm:flex-row sm:pb-0 sm:justify-center`}>
            <li>
        <NavLink
          to="/"
          className="inline-block py-2 mx-4 text-lg sm:py-0">
          Accueil
        </NavLink>
      </li>
      <li>
        <NavLink 
        to ="/search"
        className="inline-block py-2 mx-4 text-lg sm:py-0">
           Recherche
        </NavLink>
      </li>
      <li>
        <NavLink 
        to ="/pokedexList"
        className="inline-block py-2 mx-4 text-lg sm:py-0"> 
         Pokedex Complet
        </NavLink>
      </li>

    </ul>
    <button 
      onClick={()=> setShowMenu(!showMenu)}
      className="ml-auto sm:hidden"
    >
      <img 
        className="w-4" 
        src={showMenu ? close : hamburger} 
        alt={showMenu ? "Cacher le menu" : "Montrer le menu"}
      />
    </button>
  </nav>
  )
}