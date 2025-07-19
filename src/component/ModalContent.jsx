

import { useEffect, useState} from "react"
import spinner from "../assets/spinner.svg"


export default function ModalContent({closeModal,nom}) {

   const [APIState,setApiState] = useState({
      loading: false,
      error : false,
      data: undefined,
   })

 useEffect(() =>{
   setApiState({...APIState,loading:true});
   fetch (`https://tyradex.app/api/v1/pokemon/${nom.toLowerCase().trim()}`)
   .then (resp => {
      if(!resp.ok) throw new Error ("")
      return resp.json()
   })
   .then (data =>{
      setApiState({loading:false, error:false, data:data})
   })
   .catch(()=> {
      setApiState({loading: false, error:true, data:undefined})
   })
},[])

let content;

if (APIState.loading) content = <img src={spinner} alt="photo de pokemon shiny" />
else if (APIState.error) content = <p>Pokemon introuvable </p>
else if(!APIState.error && !APIState.loading && APIState.data) content = (
   <img
   src={APIState.data?.sprites?.shiny}
   alt={APIState.data?.name?.fr}
   className="mx-auto mb-4"
 />
)
    return (
      <div 
      onClick={closeModal}
      className="fixed inset-0 bg-slate-800/75 flex
       items-center justify-center">
          <div
          onClick={e =>e.stopPropagation()}
          className="bg-slate-300 text-slate-900 p-10 rounded
          relative mb-[10vh]"
          >  
          {content}
           <button
           onClick={closeModal}
           className="absolute top-1 right-1 w-7 bg-red-600
           text-slate-100 flex justify-center items-center"
           > X</button>
              
  
          </div>
       </div>
    )
  }