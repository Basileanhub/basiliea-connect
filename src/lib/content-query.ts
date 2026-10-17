import { queryOptions } from '@tanstack/react-query';
import { publicContent,currentIdentity } from './cms.functions';
export const contentOptions=queryOptions({queryKey:['ministry-content'],queryFn:()=>publicContent(),staleTime:60000});
export const identityOptions=queryOptions({queryKey:['identity'],queryFn:()=>currentIdentity(),staleTime:60000,retry:false});
