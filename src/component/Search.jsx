import {useState,useEffect, useLayoutEffect} from "react"
import spinner from "../assets/spinner.svg"

export default function Search() {

    const [nom, setNoms]= useState("")
    const [APIState,setApiState]=useState({

        loading :false,
        error : false,
        data :undefined, 
    
      }) 

function handlerSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) return; // Ne rien faire si le champ est vide
    //La méthode .trim() est utilisée pour s’assurer que si un utilisateur 
    // entre "  Pikachu  ", la requête enverra "pikachu" (sans espaces), ce qui évite les erreurs dues à des espaces non désirés.
    
    setApiState({...APIState, loading: true, error: false});
    
    fetch(`https://tyradex.app/api/v1/pokemon/${nom.toLowerCase().trim()}`)
        .then(res => {
            if (!res.ok) {
                throw new Error('Pokémon non trouvé');
            }
            return res.json();
        })
        .then(data => {
            if (data && data.pokedex_id) {
                setApiState({loading: false, error: false, data: data});
            } else {
                throw new Error('Données de Pokémon invalides');
            }
        })
        .catch((error) => {
            console.error('Erreur lors de la recherche:', error);
            setApiState({
                loading: false,
                error: true,
                data: undefined
            });
        });
}
let content; 

   if(APIState.loading) content = <img src={spinner} alt="icone de chargement"/>
   else if(APIState.error) content = <p> Pokemon introuvable...</p>
   else if (!APIState.loading && !APIState.error && APIState.data) {
    content = (
      <div className="text-center">
        <h2 className="text-2xl mb-4">{APIState.data?.name?.fr}</h2>
        <img
          src={APIState.data?.sprites?.regular}
          alt={APIState.data?.name?.fr}
          className="mx-auto mb-4"
        />
       <table className="table-auto mx-auto border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-4 py-2">Type</th>
              <th className="border border-gray-400 px-4 py-2">Talents</th>
              <th className="border border-gray-400 px-4 py-2">Statistiques</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-4 py-2">
                {APIState.data?.types?.map((type, index) => (
                  <div key={index} className="mb-2">
                    <p>{type.name}</p>
                    <img src={type.image} alt={type.name} className="h-8 mx-auto" />
                  </div>
                ))}
              </td>
              <td className="border border-gray-400 px-4 py-2">
                {APIState.data?.talents?.map((talent, index) => (
                  <p key={index}>{talent.name}</p>
                ))}
              </td>
              <td className="border border-gray-400 px-4 py-2 text-left">
                <p>HP : {APIState.data?.stats?.hp}</p>
                <p>ATK : {APIState.data?.stats?.atk}</p>
                <p>DEF : {APIState.data?.stats?.def}</p>
                <p>SPE ATK : {APIState.data?.stats?.spe_atk}</p>
                <p>SPE DEF : {APIState.data?.stats?.spe_def}</p>
                <p>VIT : {APIState.data?.stats?.vit}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
   
  return (
    <div>
      <form onSubmit={handlerSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto">
         <label  className ="text-center text-6xl font-bold text-neutral-600 font-serif" htmlFor="recherche">Pokedex</label>
          <input id="recherche" 
          value={nom}
          onChange={e => setNoms(e.target.value)} 
          className="w-full max-w-md bg-slate-200 px-5 border-gray-700 rounded" 
          type="text" />
          <button className="w-full max-w-md 2xl bg-red-600 text-blue-50 rounded">Rercher</button>
          {content}
        </form>
    </div>
  )
} 