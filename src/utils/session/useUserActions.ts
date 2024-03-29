import { Dish, NutritionalRequirements, Portion } from '../../components/dashboard/typeUtil'
import { atom, useSetRecoilState, useRecoilState } from 'recoil';
import { TimeInfo } from '../../components/state';
import { mealToAPIForm, MealState, fullVolumeByPortion } from '../../components/dashboard/typeUtil';
import { authAtom, useFetchWrapper } from './useFetchWrapper';
import { APIMealSuggest, APIPortionSuggestEntry, APIPortionSuggest, APIMealEvent, APIMealByTimePayload, APIAnalyticsMealChoiceEntry, APIUserSettings, APIKey, APIRegisterSettings, APIVersionResponse } from './apiTypes';
import { usePersistentAtom } from '../state/userState';
import {useEffect} from 'react';
import Constants from "expo-constants"

import Login from '../../components/login/Login';
import { TEST } from '../../../App';
import * as ImagePicker from 'expo-image-picker';
import TrayItem from '../../components/dashboard/TrayItem';
import * as Segment from 'expo-analytics-segment';
import * as Device from 'expo-device';

export const usersAtom = atom({
    key: "usersAtom",
    default: null as APIUserSettings,
})

export const ingredientsAtom = atom({
    key: "ingredientsAtom",
    default: null as {
        id: APIKey,
        name: string,
        school: APIKey,
    }[]
})

type ErrType<Value> = {
    ok: false, 
    err: true,
    val: Value
}

function Err<V>(val:V){
    return {
        err: true,
        ok: false,
        val
    } as ErrType<V>
}

type OkType<Value> = {
    ok: true, 
    err: false, 
    val: Value
}

function Ok<V>(val:V){
    return {
        ok: true,
        err: false,
        val
    } as OkType<V>
}

export { useUserActions };
const LB_PER_KG = 2.2046 
const CM_PER_INCH =2.54
export const UNVERFIED_USER_ERROR_MESSAGE = "User is not verified."
export type LoginError = "User is not verified." | "General error"
export type ImageResult = {uri: string, height: number, width: number, exif?: any}
function useUserActions () {
    const baseUrl = "https://weplate-backend.nn.r.appspot.com";
    // const baseUrl = "https://mosesxu.ca/weplate";
    const fetchWrapper = useFetchWrapper();
    const [auth,setAuth] = useRecoilState(authAtom);
    const [users, setUsers] = useRecoilState(usersAtom);
    const [ingredients,setIngredients] = useRecoilState(ingredientsAtom)
    const [persistentState,setPersistentState,fetchPersistentState] = usePersistentAtom()
    useEffect( ()=>{
        fetchPersistentState()
    },[])

    return {
        login,
        logout,
        getAll,
        mealsByTime,
        mealById,
        suggestionByMealId,
        portionSuggestionByItemID,
        postAnalyticsMealChoices,
        getAnalyticsMealChoices,
        postAnalyticsMealItemVote,
        postAnalyticsTextFeedback,
        postUserSettings,
        getIngredients,
        getNutritionalRequirements,
        registerUser,
        checkEmail,
        checkVersion,
        verifyEmail,
        isVerified,
        postPushToken,
        postItemImage,
        resetPassword,
    }
   

    function kgToLbs(kg){
        return kg*LB_PER_KG
    }
    function LbsToKg(kg){
        return kg/LB_PER_KG
    }

    function InchToCm(cm){
        return cm*CM_PER_INCH
    }
    function CmToInch(cm){
        return cm/CM_PER_INCH
    }
    async function login(email:string, password:string) {
        let data = {
            username: email.toLowerCase(),
            password,
        }
        console.log("LOGIN!",data)

        // if(auth?.token !== null) return
        try{
            const _auth = await fetchWrapper.post(`${baseUrl}/api/token_auth/`, data)
            
            console.log({_auth})
            if(!("token" in _auth)) throw new Error("Invalid auth" + password +" "+email)
            
            setAuth(_auth)

            const userInfo : APIUserSettings = await fetchWrapper.get(`${baseUrl}/api/settings/`,null,{auth:_auth})
            console.log({userInfo})
            if(userInfo?.is_verified == null){
                console.log("unverified!")
                return Err(UNVERFIED_USER_ERROR_MESSAGE as LoginError)
            }

            const fixedUserInfo : APIUserSettings = {
                ... userInfo,
                weight: kgToLbs(userInfo?.weight),
                height: CmToInch(userInfo?.height),
            }
            setUsers(fixedUserInfo)
            console.log({userInfo})
            Segment.identifyWithTraits(email,fixedUserInfo)
            // get return url from location state or default to home page
            // const { from } = history.location.state || { from: { pathname: '/' } };
            // history.push(from);

            return Ok({auth:_auth, userInfo: fixedUserInfo});
        }catch(e){
            console.error(e)
            return Err("General Error" as LoginError)
        }
    }
    async function mealsByTime(timeInfo:TimeInfo){
        const endpoint = `${baseUrl}/api/meals/?date=${encodeURIComponent(timeInfo.date)}&group=${encodeURIComponent(mealToAPIForm(timeInfo.meal))}`
        console.log("MEALS BY TIME:",endpoint)
        // console.log({endpoint})
        const resp = await fetchWrapper.get(endpoint)
        if(resp == null) throw new Error(`No data.`)
        return resp as APIMealByTimePayload
    }
    async function mealById(id:APIKey){
        const endpoint = `${baseUrl}/api/meals/${encodeURIComponent(id)}/`
        console.log({endpoint})
        const resp = await fetchWrapper.get(endpoint)
        return resp as APIMealEvent
    }
    async function suggestionByMealId(id:APIKey,volumes: {large: number, small : number}){
        let {large,small} = volumes ?? {large: 610, small: 270}
        large = large ?? 610;
        small = small ?? 270;
        const endpoint =  `${baseUrl}/api/suggest/${encodeURIComponent(id)}/items/?large_max_volume=${encodeURIComponent(large)}&small_max_volume=${encodeURIComponent(small)}`
        console.log(endpoint)
        const resp = await fetchWrapper.get(endpoint)
        return resp as APIMealSuggest;
    }
    async function portionSuggestionByItemID(small1: APIKey[], small2: APIKey[], large: APIKey[],volumes: {large: number, small : number}){
        let {large:largeVol,small:smallVol} = volumes ?? {large: 610, small: 270}
        largeVol = largeVol ?? 610;
        smallVol = smallVol ?? 270;
        const endpoint = `${baseUrl}/api/suggest/portions/?${ small1.map(id => `&small1=${encodeURIComponent(id)}`).join("") } ${ small2.map( id => `&small2=${encodeURIComponent(id)}`).join("") } ${ large.map( id => `&large=${id}`).join("") } &large_max_volume=${encodeURIComponent(largeVol)} &small_max_volume=${encodeURIComponent(smallVol)}`
        console.log(endpoint)
        const resp = await fetchWrapper.get(endpoint)
        return resp as APIPortionSuggest;
    }
    async function postAnalyticsMealChoices(mealState : MealState){
        console.log("Posting")
        const endpoint =  `${baseUrl}/api/analytics/meal_choice/`
        const resp = await fetchWrapper.post(endpoint,{
            meal: mealState.mealID,
            small1: mealState.dishA.map(dish=>dish.id),
            small2: mealState.dishB.map(dish=>dish.id),
            large: mealState.dishC.map(dish=>dish.id),
            small1_portion: mealState.dishA.map(dish=>dish.portion),
            small2_portion: mealState.dishB.map(dish=>dish.portion),
            large_portion: mealState.dishC.map(dish=>dish.portion),
        })
        return resp as {detail:string}
    }
    async function postAnalyticsTextFeedback(text:string){
        console.log("Posting")
        const endpoint = `${baseUrl}/api/analytics/text_feedback/`
        const resp = await fetchWrapper.post(endpoint,{
            feedback: text
        })
        console.log(resp)
    }
    async function getAnalyticsMealChoices(mealId:APIKey){
        const endpoint = `${baseUrl}/api/analytics/meal_choice/?meal=${encodeURIComponent(mealId)}`
        const resp = await fetchWrapper.get(endpoint)
        return resp as Array<APIAnalyticsMealChoiceEntry>
    }

    async function postAnalyticsMealItemVote(mealItemId: APIKey,liked: boolean){
        console.log("Posting")
        const endpoint = `${baseUrl}/api/analytics/meal_item_vote/`
        const resp = await fetchWrapper.post(endpoint,{
            meal_item: mealItemId,
            liked
        })
        return resp as {detail: string}
    }
    async function postUserSettings(newUser: APIUserSettings){
        console.log("Posting")
        const endpoint = `${baseUrl}/api/settings/update/`
        const resp = await fetchWrapper.post(endpoint,{
            ... newUser,
            height: InchToCm(newUser.height),
            weight: LbsToKg(newUser.weight),
            ban: [],
            favour: [],
            allergies: newUser.allergies.map(el=> el.id),
        })
        return resp
    }
    async function registerUser(newUser: APIRegisterSettings){
        const endpoint = `${baseUrl}/api/register/`
        const resp = await fetchWrapper.post(endpoint,{
            ...newUser,
            height: InchToCm(newUser.height),
            weight: LbsToKg(newUser.weight),
            ban: [],
            favour: [],
            allergies: newUser.allergies.map(el=> el.id),
        })
        return resp
    }
    async function getIngredients(){
        if(users?.school === null) return null
        if(ingredients != null) return ingredients

        const endpoint = `${baseUrl}/api/ingredients/${encodeURIComponent(users?.school)}/`
        console.log(endpoint)
        const resp = await fetchWrapper.get(endpoint)
        setIngredients(resp)
        return resp as {
            id: APIKey,
            name: string,
            school: APIKey,
        }[]
    }

    async function getNutritionalRequirements(){
        const endpoint = `${baseUrl}/api/nutritional_requirements/`
        const resp = await fetchWrapper.get(endpoint)
        return resp as NutritionalRequirements 
    }
    async function checkEmail(email:string){
        const endpoint = `${baseUrl}/api/register/check_email/${encodeURIComponent(email)}/`
        console.log({endpoint})
        const resp = await fetchWrapper.get(endpoint)
        return resp
    }

    async function checkVersion(){
        const version = Constants.manifest.version
        const defaultResp = {
            backend_version: version,
            compatible: true,
            handling_update: 'none',
        } as APIVersionResponse
        if(__DEV__|| TEST){
            return defaultResp;
        }
        const endpoint = `${baseUrl}/api/version/?version=${encodeURIComponent(version)}/`
        console.log({endpoint})
        try{
            const resp = await fetchWrapper.get(endpoint)
            if(!resp){
                return defaultResp;
            }
            return resp as APIVersionResponse
        }catch(e){
            return defaultResp
        }
    }

    async function verifyEmail(email:string){
        const endpoint = `${baseUrl}/api/verify_email/`
        const resp = await fetchWrapper.post(endpoint,{email})
        return resp;
    }
    async function isVerified(){
       try{
        const userInfo : APIUserSettings = await fetchWrapper.get(`${baseUrl}/api/settings/`)
        const detail = userInfo?.is_verified;
        console.log({userInfo,detail})
        if(!!detail){
            return true;
        }else{
            return false;
        }
       }catch(e){
           return false
       } 
    }
    async function postPushToken(token:string){
        if(persistentState?.expoPush?.token != token){
            const endpoint_post = `${baseUrl}/api/notification/expo_push_token/`
            const existing_tokens = (await fetchWrapper.get(endpoint_post) )?? []
            // as [{
            //     id: APIKey,
            //     token: string,
            //     device: string,
            //     timestamp: string
            // }]
            console.log({existing_tokens})

            if(existing_tokens.map(el=> el.token).includes(token)) return

            const body = {
                token,
                device: Device.deviceName
            }
            const resp = await fetchWrapper.post(endpoint_post,body) 
            // as {
            //     id: APIKey,
            //     token: string,
            //     device: string
            // }
            console.log({
                token_post: resp,
                body
            })
            await setPersistentState(
                {... persistentState,
                    expoPush: {
                        id: resp.id,
                        token,
                    }
                }
            ) 
        }
    }
    async function deletePushToken(){
        const id = persistentState?.expoPush?.id
        if(id){
            const endpoint = `${baseUrl}/api/notification/expo_push_token/${encodeURIComponent(id)}/`
            const resp = await fetchWrapper.delete(endpoint)
        }
    }
    
    async function postItemImage(pickerResult: ImageResult, dish: Dish){
        // if(){
            const formData = new FormData();

            let localUri = pickerResult.uri;
            let filename = localUri.split('/').pop();
          
            // Infer the type of the image
            let match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1]}` : `image`;

            formData.append('image', { uri: localUri, name: filename, type } as any);
            formData.append('item',dish.id as string)
            formData.append('data', JSON.stringify({
                dish_id: dish.id,
                image:{
                    height: pickerResult.height,
                    width: pickerResult.width,
                    exif: pickerResult?.exif
                }
            }));
            
            try{
                const endpoint = `${baseUrl}/api/suggest/item_image/`
                const resp = await fetchWrapper.post(endpoint,formData,{bodyType:"form"})
                return resp
            }catch(e){

            }

        // }
    }

    async function resetPassword(email:string,newPassword:string){
        const endpoint = `${baseUrl}/api/reset_password/`
        console.log({endpoint})
        const resp = await fetchWrapper.post(endpoint,{email,password:newPassword})
        if(resp?.detail != "ok"){
            console.log({resp})
            throw new Error("failed to reset password");
        }
    }

    async function logout() {
        // remove user from local storage, set auth state to null and redirect to login page
        await deletePushToken()
        await setPersistentState({
            ...persistentState,
            email: null,
            password: null,
            doOnboarding: true,
            expoPush: null,
        })
        setAuth(null);
        // history.push('/login');
    }


    function getAll() {
        return fetchWrapper.get(baseUrl).then(setUsers);
    }    
}