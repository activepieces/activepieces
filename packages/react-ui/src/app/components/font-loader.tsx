import { useEmbedding } from "@/components/embed-provider";
import { api } from "@/lib/api";
import { isNil } from "@activepieces/shared";
import { useSuspenseQuery } from "@tanstack/react-query";
const defaultFont = 'Roboto';
const useDownloadEmbeddingFont = ()=>{
  const {embedState} = useEmbedding();
  useSuspenseQuery<string, Error>({
    queryKey: ['font', embedState.fontFamily, embedState.fontUrl],
    queryFn: async ()=> {
      try{
        if(embedState.isEmbedded && !isNil(embedState.fontUrl) && !isNil(embedState.fontFamily)){
         return api.get(embedState.fontUrl).then(()=>{
            const link = document.createElement('link');
            link.href= embedState.fontUrl!;
            link.rel= 'stylesheet';
            document.head.appendChild(link);
            document.body.style.fontFamily= `"${embedState.fontFamily!}", Roboto, sans-serif`;
            return embedState.fontFamily!;
          })
        }
      } catch (error) {
        console.error(error);
        return defaultFont;
      }
      return defaultFont;
    }
})
}
const FontLoader = ({children}: {children: React.ReactNode}) => {
  useDownloadEmbeddingFont();
  
  return (
    <>
      {children}
    </>
  )
}

FontLoader.displayName = 'FontLoader';

export {FontLoader};