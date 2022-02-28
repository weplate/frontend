import AsyncStorage from '@react-native-async-storage/async-storage'
import {atom, useRecoilState, } from 'recoil'

const persistentAtom = atom({
    key: "persistentAtom",
    default: {
        loaded: false,
        doOnboarding: true,
        email: null,
        password: null,
    },
})

export function usePersistentAtom(){
    const [pers,setPers] = useRecoilState(persistentAtom)
    async function fetchPersistentAtom(){
        const resstring = await AsyncStorage.getItem("persist")
        // console.log({resstring})
        if(resstring){
            const res = JSON.parse(resstring)
            const newPers = {
                ...res,
                loaded: true,
            }
            if(newPers !== pers){
                setPers(newPers)
            }
        }else{
            const newPers = {
                ...pers,
                loaded: true,
            }
            if(pers !== newPers){
                await setPersistentAtom(newPers)
                setPers(newPers)
            }
        }
    }
    async function setPersistentAtom(value){
        const newPers = {
            ...pers,
            ...value
        }
        setPers(newPers)
        await AsyncStorage.setItem("persist",JSON.stringify(newPers))
    }
    return [pers,setPersistentAtom,fetchPersistentAtom]

}