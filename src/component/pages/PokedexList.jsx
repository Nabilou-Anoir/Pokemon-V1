// Importation des hooks React pour la gestion d'état et des effets de bord.
import { useState, useEffect } from "react"
// Importation de l'image spinner pour l'affichage du chargement.
import spinner from "../../assets/spinner.svg"

export default function PokedexList() {

  // Déclaration de l'état pour la page courante, initialisée à 1.
  const [currentPage, setCurrentPage] = useState(1);
  // Nombre d'éléments à récupérer par page.
  const limit = 150;
  // État pour stocker le nombre total de pages, initialisé à 0.
  const [totalPages, setTotalPages] = useState(0);

  // Objet cache pour stocker les données mises en cache par page, avec un timestamp.
  const cache = {}; // { [page]: { data: [...], timestamp: 123456789 } }
  // Durée de vie du cache en millisecondes (ici 5 minutes).
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // État global pour gérer le chargement, les erreurs et les données récupérées.
  const [APIState, setApiState] = useState({
    loading: false,
    error: false,
    data: undefined,
  });

  // Hook d'effet pour exécuter la récupération des données à chaque changement de currentPage.
  useEffect(() => {
    // Date.now() retourne le timestamp actuel en millisecondes depuis le 1er janvier 1970.
    const now = Date.now();

    // Mise à jour de l'état pour indiquer que le chargement commence.
    // La syntaxe prev => ({ ...prev, loading: true }) permet de conserver l'état précédent
    // et de modifier uniquement la propriété 'loading' à true.
    setApiState(prev => ({ ...prev, loading: true }));

    // Calcul de l'offset pour la pagination : nombre d'éléments à sauter avant de récupérer les suivants.
    const offset = (currentPage - 1) * limit;

    // Appel à l'API avec fetch pour récupérer la liste des Pokémon selon la page et la limite.
    fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)
      .then((res) => {
        // Vérification que la réponse est correcte (status HTTP 200-299).
        if (!res.ok) throw new Error("Erreur lors la recupération des données");
        // Conversion de la réponse en JSON.
        return res.json();
      })
      .then(data => {
        // Calcul du nombre total de pages en fonction du nombre total de Pokémon et de la limite.
        setTotalPages(Math.ceil(data.count / limit));

        // Vérification si les données de la page actuelle sont déjà en cache et encore valides.
        const cached = cache[currentPage];
        if (cached && (now - cached.timestamp < CACHE_TTL)) {
          // Si les données sont en cache et valides, on les utilise directement sans nouvelle requête.
          setApiState({ loading: false, error: false, data: cached.data });
          return;
        }

        // Promise.all permet d'attendre la résolution de toutes les promesses dans le tableau en parallèle.
        // Ici, on récupère les détails de chaque Pokémon et leurs noms en français et anglais.
        return Promise.all(
          data.results.map(item =>
            // Pour chaque Pokémon, on récupère ses données détaillées.
            fetch(item.url)
              .then(res => res.json())
              .then(pokemonData =>
                // Puis on récupère les données de l'espèce pour obtenir les noms localisés.
                fetch(pokemonData.species.url)
                  .then(res => res.json())
                  .then(speciesData => {
                    // Recherche du nom français dans la liste des noms localisés.
                    const frenchNameObj = speciesData.names.find(n => n.language.name === "fr");
                    // Recherche du nom anglais dans la liste des noms localisés.
                    const englishNameObj = speciesData.names.find(n => n.language.name === "en");

                    // Retour d'un objet contenant les informations nécessaires pour l'affichage.
                    return {
                      id: pokemonData.id,
                      sprites: {
                        front_default: pokemonData.sprites.front_default
                      },
                      // Si le nom français n'est pas trouvé, on utilise le nom par défaut.
                      frenchName: frenchNameObj ? frenchNameObj.name : pokemonData.name,
                      // Si le nom anglais n'est pas trouvé, on utilise le nom par défaut.
                      englishName: englishNameObj ? englishNameObj.name : pokemonData.name
                    };
                  })
              )
          )
        ).then(detailedData => {
          // Mise en cache des données récupérées avec le timestamp actuel.
          cache[currentPage] = { data: detailedData, timestamp: now };
          // Mise à jour de l'état pour indiquer que le chargement est terminé sans erreur, avec les données.
          setApiState({ loading: false, error: false, data: detailedData });
        });
      })
      .catch((err) => {
        // En cas d'erreur lors de la récupération ou du traitement, affichage dans la console.
        console.error("Erreur :", err)
        // Mise à jour de l'état pour indiquer l'erreur et absence de données.
        setApiState({ loading: false, error: true, data: undefined });
      });
  }, [currentPage])

  // Détermination du contenu à afficher selon l'état de chargement, d'erreur ou de disponibilité des données.
  let content;

  // Affichage du spinner de chargement si les données sont en cours de récupération.
  if (APIState.loading)
    content = <img src={spinner} alt="Icon chargement" />;
  // Affichage d'un message d'erreur en cas de problème lors de la récupération des données.
  else if (APIState.error)
    content = <p>Une erreur est survenue </p>;
  // Si les données sont disponibles, affichage de la liste des cartes Pokémon.
  else if (APIState.data?.length > 0) {
    content = (
      // Boucle de rendu des cartes Pokémon, chaque carte affiche le sprite, le nom français et anglais.
      <ul className="max-w-6xl min-h-[250px] mx-auto mt-4 mb-7 rounded border border-slate-400 flex flex-wrap justify-center gap-x-1 px-1 pt-8 ">
        {APIState.data.map(item => (
          <button key={item.id}>
            <div className="bg-white shadow-md rounded p-4 m-2 w-40 flex flex-col items-center text-center hover:bg-slate-100">
              {/* Affichage du sprite du Pokémon */}
              <img src={item.sprites.front_default} alt={item.name} className="w-20 h-20" />
              {/* Affichage du nom français en gras */}
              <span className="font-bold mt-2">{item.frenchName}</span>
              {/* Affichage du nom anglais en texte plus petit et gris */}
              <span className="text-sm text-gray-500">{item.englishName}</span>
            </div>
          </button>
        ))}
      </ul>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Affichage du contenu principal selon l'état (chargement, erreur ou liste des Pokémon) */}
      {content}
      {/* Système de pagination dynamique : création des boutons pour chaque page */}
      <div className="flex justify-center flex-wrap mt-2 mb-16 gap-2 bg-white border border-gray-300 rounded">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            // Mise en évidence du bouton de la page courante.
            className={`px-3 py-1 rounded ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}