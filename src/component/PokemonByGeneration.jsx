import { useState, useEffect, useRef } from "react"
import spinner from "../assets/spinner.svg"
import PokedexList from "./pages/PokedexList";

// 💡 Pourquoi on utilise await parfois (même si ici on ne l’utilise pas) :
// Le mot-clé `await` permet d’écrire du code asynchrone de manière plus lisible,
// comme si c’était du code synchrone. Exemple :
// const res = await fetch(...); const data = await res.json();
// Mais ici, on garde la logique avec .then() pour enchaîner les promesses sans await,
// ce qui est aussi totalement valide.

export default function PokemonByGeneration() {
    // État pour garder en mémoire la génération sélectionnée (par défaut, la première génération)
    const[selectedTab,setSelectedTab]= useState(1)
    
    // APIState contient l'état global de la requête API :
    // loading : indique si la requête est en cours
    // error : indique s'il y a eu une erreur lors de la requête
    // data : stocke les données récupérées (tableau de Pokémon détaillés)
    const [APIState,setApiState]=useState ({
        loading: false,
        error:false,
        data:undefined,
    });

    // Ref pour mémoriser les données déjà chargées afin d'éviter des appels réseau inutiles
    const cacheRef = useRef({});

    // tabsData est un tableau d'objets représentant les onglets de génération
    // Chaque objet contient un id (1 à 9) et le texte affiché pour l'onglet
    const tabsData = [
        { id: 1, txt: "Génération I" },
        { id: 2, txt: "Génération II" },
        { id: 3, txt: "Génération III" },
        { id: 4, txt: "Génération IV" },
        { id: 5, txt: "Génération V" },
        { id: 6, txt: "Génération VI" },
        { id: 7, txt: "Génération VII" },
        { id: 8, txt: "Génération VIII" },
        { id: 9, txt: "Génération IX" },
    ];
    
    // useEffect se déclenche à chaque changement de selectedTab
    // Il lance la récupération des données des Pokémon de la génération choisie
    useEffect(() => {
        // Si les données sont déjà en cache, les utiliser directement sans refaire la requête réseau
        if (cacheRef.current[selectedTab]) {
            setApiState({ loading: false, error: false, data: cacheRef.current[selectedTab] });
            return;
        }

        // Sinon, on indique que le chargement commence (loading = true)
        setApiState({ ...APIState, loading: true });

        // Requête vers l'API pour récupérer les espèces de Pokémon de la génération sélectionnée
        fetch(`https://pokeapi.co/api/v2/generation/${selectedTab}`)
            .then((res) => {
                // Vérifie si la réponse est correcte, sinon on déclenche une erreur
                if (!res.ok) throw new Error("Erreur lors la recupération des données");
                return res.json();
            })
            .then(data => {
                // Pour chaque espèce de Pokémon, on va récupérer ses données détaillées
                return Promise.all(
                    data.pokemon_species.map(species =>
                        fetch(species.url)
                            .then(res => res.json())
                            .then(speciesData => {
                                // On trouve la variété par défaut du Pokémon (forme principale)
                                const defaultVariety = speciesData.varieties.find(v => v.is_default);
                                if (!defaultVariety) throw new Error("Pas de forme par défaut");

                                // On récupère ensuite les données du Pokémon correspondant à cette variété par défaut
                                return fetch(defaultVariety.pokemon.url)
                                    .then(res => res.json())
                                    .then(pokemonData => {
                                        // On cherche les noms en français et en anglais pour un affichage localisé
                                        const frenchNameObj = speciesData.names.find(n => n.language.name === "fr");
                                        const englishNameObj = speciesData.names.find(n => n.language.name === "en");

                                        // On retourne un objet combinant les données du Pokémon et ses noms localisés
                                        return {
                                            ...pokemonData,
                                            frenchName: frenchNameObj ? frenchNameObj.name : pokemonData.name,
                                            englishName: englishNameObj ? englishNameObj.name : pokemonData.name
                                        };
                                    });
                            })
                            .catch(error => {
                                // En cas d'erreur lors du fetch d'un Pokémon, on affiche un avertissement et on ignore ce Pokémon
                                console.warn(`Erreur pour ${species.name}:`, error.message);
                                return null;
                            })
                    )
                );
            })
            .then(detailedData => {
                // On filtre les données pour retirer les Pokémon qui n'ont pas pu être chargés (null)
                const filtered = detailedData.filter(p => p !== null);
                // On met en cache les données pour la génération sélectionnée afin d'éviter de refaire la requête plus tard
                cacheRef.current[selectedTab] = filtered;
                // On met à jour l'état avec les données chargées et on indique que le chargement est terminé sans erreur
                setApiState({ loading: false, error: false, data: filtered });
            })
            .catch((err) => {
                // En cas d'erreur générale (ex: problème réseau), on affiche un message d'erreur et on arrête le chargement
                console.error("Erreur :", err);
                setApiState({ loading: false, error: true, data: undefined });
            });
    }, [selectedTab]);
          
    // Variable content qui contiendra le contenu à afficher en fonction de l'état APIState
    let content;
    
    // Affichage conditionnel selon l'état de la requête :
    if (APIState.loading) 
        // Si on charge les données, on affiche un spinner pour indiquer que ça travaille en arrière-plan
        content =<img src={spinner} alt="Icon chargement" />
    else if (APIState.error )
        // En cas d'erreur, on affiche un message d'erreur simple pour informer l'utilisateur
        content = <p>Une erreur est survenue </p>
    else if (APIState.data?.length > 0) {
        // Si on a des données, on affiche la liste des Pokémon sous forme de grille responsive
        content = (
            <ul className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {APIState.data.map(item => (
                    <li key={item.id} className="w-full">
                        <button className="bg-white shadow-md rounded p-4 flex flex-col items-center text-center w-full h-full hover:bg-slate-100">
                            {/* Affichage de l'image du Pokémon */}
                            <img src={item.sprites.front_default} alt={item.name} className="w-20 h-20" />
                            {/* Nom français en gras */}
                            <span className="font-bold mt-2">{item.frenchName}</span>
                            {/* Nom anglais en gris plus petit */}
                            <span className="text-sm text-gray-500">{item.englishName}</span>
                        </button>
                    </li>
                ))}
            </ul>
        );
    }

    // Rendu principal du composant
    return (
        // Conteneur principal avec une largeur maximale et une bordure pour délimiter la zone
        <div className="w-full max-w-7xl min-h-[250px] mx-auto rounded border border-slate-400">
            {/* Barre d'onglets pour sélectionner la génération */}
            <div className="flex divide-x divide-slate-700">
                {tabsData.map((obj,index)=>(
                    <button
                        key ={index}
                        // Au clic, on change la génération sélectionnée en mettant à jour selectedTab
                        onClick={()=> setSelectedTab(obj.id)}
                        className="w-full p-4 bg-slate-200 hover:bg-slate-300">
                        {/* Affichage du texte de l'onglet (ex : Generation 1) */}
                        Generation {index+1}
                    </button>
                ) )}
            </div>
            {/* Contenu affiché sous la barre d'onglets */}
            <div className="w-full p-4">
                {/* Affiche le texte de la génération sélectionnée pour informer l'utilisateur */}
                <p className="text-slate-100">{tabsData.find(t => t.id === selectedTab)?.txt}</p>
                {/* Affichage conditionnel du contenu (spinner, erreur ou liste) */}
                {content}
            </div>
        </div>
    )
}