import { useState,useEffect } from "react"
import spinner from "../../assets/spinner.svg"

export default function PokedexList() {

 const [APIState,setApiState]=useState ({
    loading: false,
    error:false,
    data:undefined,
 });

useEffect(() => {
    setApiState ({...APIState, loading:true})

    fetch ("https://pokeapi.co/api/v2/pokemon?limit=151")
        .then ((res) => {    
        if (!res.ok) throw new Error ("Erreur lors la recupération des données");
            return res.json();
         })
         .then(data => {
            return Promise.all(
              data.results.map(item =>
                fetch(item.url)
                  .then(res => res.json())
                  .then(pokemonData =>
                    fetch(pokemonData.species.url)
                      .then(res => res.json())
                      .then(speciesData => {
                        const frenchNameObj = speciesData.names.find(n => n.language.name === "fr");
                        const englishNameObj = speciesData.names.find(n => n.language.name === "en");

                        return {
                          ...pokemonData,
                          frenchName: frenchNameObj ? frenchNameObj.name : pokemonData.name,
                          englishName: englishNameObj ? englishNameObj.name : pokemonData.name
                        };
                      })
                  )
              )
            );
          })
        .then(detailedData => {  
          setApiState({ loading: false, error: false, data: detailedData });
        })
        .catch((err)=> {
          console.error ("Erreur :" , err)
          setApiState({loading: false,error: true, data: undefined})
    
        })
    
      },[])

                  // 1.	data.results.map(...)
            //     → Tu parcours chaque Pokémon de la liste (data.results)
            //     → Pour chacun, tu fais un fetch(item.url) pour aller chercher ses données complètes (avec image, stats, etc.).

         	//2.	Chaque fetch(...).then(...) est une promesse
            //   → Ça veut dire : “Quand ce fetch est terminé, transforme-le en JSON”

            // 3.	Tu te retrouves avec un tableau de promesses
            // Exemple 

             //4.	Promise.all([...]) attend que TOUTES ces promesses soient finies
            //→ Il ne continue pas tant que tous les fetch(...).then(...) n’ont pas terminé.

            // 5.	Le .then(detailedData => {...}) reçoit un tableau complet
            // → Ce tableau contient chaque Pokémon avec toutes ses infos :
            // sprites, types, stats, id, etc.
      
let content;


if (APIState.loading) content =<img src={spinner} alt="Icon chargement" />
else if (APIState.error ) content = <p>Une erreur est survenue </p>
else if (APIState.data?.length > 0) {
  content = (
   
    <ul className="max-w-6xl min-h-[250px] mx-auto mt-4 rounded border
     border-slate-400 flex flex-wrap justify-center gap-x-1 px-1 pt-8 ">
      {APIState.data.map(item => (
        <li key={item.id}>
          <div className="bg-white shadow-md rounded p-4 m-2 w-40 flex flex-col items-center text-center">
            <img src={item.sprites.front_default} alt={item.name} className="w-20 h-20" />
            <span className="font-bold mt-2">{item.frenchName}</span>
            <span className="text-sm text-gray-500">{item.englishName}</span>
          </div>
        </li>
      ))}
    </ul>
    
  );
}

return (
  <div>
    {content}
  </div>
);
}