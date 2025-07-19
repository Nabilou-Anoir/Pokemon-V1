import {useState,useEffect, useLayoutEffect,useRef} from "react"
import spinner from "../assets/spinner.svg"
import "./Search.css"
import metha from "..//assets/metha.png"
import { createPortal} from "react-dom"
import ModalContent from "./ModalContent"


function getStatColor(statName, value) {
  if (value < 50) return "#b91c1c";      // rouge foncé
  if (value < 70) return "#ea580c";      // orange
  if (value < 90) return "#eab308";      // jaune
  if (value < 110) return "#22c55e";     // vert clair
  if (value < 130) return "#3b82f6";     // bleu
  return "#8b5cf6";                      // violet
}

function getStatInterpretation(value) {
  if (value < 50) return "Très faible";
  if (value < 70) return "Faible";
  if (value < 90) return "Moyen";
  if (value < 110) return "Bon";
  if (value < 130) return "Très bon";
  return "Excellent";
}

 

export default function Search() {

    const [nom, setNoms]= useState("");
    const refContainer = useRef();
    const [showModal,setShowModal]=useState(false)
    const [APIState,setApiState]=useState({

        loading :false,
        error : false,
        data :undefined, 
    
      }) 


      useEffect(() => {
        if (!refContainer.current) return; // Ne rien faire si le ref n'est pas prêt

        const observer = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            if (refContainer.current) {
              refContainer.current.classList.add("active");
              observer.unobserve(refContainer.current);
            }
          }
        });

        observer.observe(refContainer.current);

        return () => {
          if (refContainer.current) {
            observer.unobserve(refContainer.current);
          }
        };
      }, [APIState.data]);
      

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

<div ref={refContainer} className="refContainer">

</div>

   if(APIState.loading) content = <img src={spinner} alt="icone de chargement"/>
   else if(APIState.error) content = <p> Pokemon introuvable... <img src={metha} alt="Methamorph" /></p>
   else if (!APIState.loading && !APIState.error && APIState.data) {
    content = (
      <div className="text-center">
        <h2 className="text-2xl mb-4">{APIState.data?.name?.fr}</h2>
        <img
          src={APIState.data?.sprites?.regular}
          alt={APIState.data?.name?.fr}
          className="mx-auto mb-4"
        />
        {APIState.data && (
  <div ref={refContainer} className="refContainer">
        <button type="button" onClick={()=>setShowModal(true)}>
            Voir le pokemon shiny
        </button>
        {showModal && createPortal(<ModalContent closeModal={()=>setShowModal(false)} nom ={nom}/>, document.body)}
  </div>
)}
       <table className="table-auto mx-auto border-collapse border border-gray-400 m-20">
          <thead>
            <tr>
              <th className="border border-gray-400 px-4 py-2">Type</th>
              <th className="border border-gray-400 px-4 py-2">Talents</th>
              <th className="border border-gray-400 px-4 py-2">Statistiques</th>
              <th className="border border-gray-400 px-4 py-2">Faiblesse</th>
              
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-4 py-2 ">
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
                {Object.entries(APIState.data?.stats || {}).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <p className="mb-1">{key.toUpperCase().replace("_", " ")} : {value}</p>
                    <div className="w-full bg-gray-200 rounded h-4" style={{ maxWidth: "320px" }}>
                      <div
                        className={`h-4 rounded flex items-center justify-center px-2 text-xs`}
                        style={{
                          width: `${Math.min(value, 100)}%`,
                          minWidth: "4.5rem",
                          backgroundColor: getStatColor(key, value),
                        }}
                      >
                        <span className="text-black whitespace-nowrap">{getStatInterpretation(value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </td>
              <td className="border border-gray-400 px-4 py-10">
              {APIState.data?.resistances?.map((resistance, index) => (
              <div key={index} className="mb-1">
              <p>
              {resistance.name} : 
              <span className={ resistance.multiplier > 2 ? "text-white bg-red-600 rounded p-1 m-1"
              : resistance.multiplier > 1 ? "text-orange-400" 
              : resistance.multiplier === 0 ? "text-blue-600"
              : resistance.multiplier < 1 ? "text-green-700" 
              
              : ""
              } > {resistance.multiplier}
              {/* {APIState.data?.resistances?.map((resistance, index) => {
  const colorClass = resistance.multiplier > 2
    ? "text-white bg-red-600 rounded p-1 m-1"
    : resistance.multiplier > 1
    ? "text-orange-400"
    : resistance.multiplier === 0
    ? "text-blue-600"
    : resistance.multiplier < 1
    ? "text-green-700"
    : "";

  return (
    <div key={index} className="mb-1">
      <p>
        <span className={colorClass}>{resistance.name}</span> : 
        <span className={colorClass}> {resistance.multiplier}</span>
      </p>
    </div>
  );
})} */}
            </span>
          </p>
       </div>
))}
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
          <button className="w-full max-w-md 2xl bg-red-600 text-blue-50 rounded">Recherche</button>
          {content}
        </form>

    </div>
  )
} 