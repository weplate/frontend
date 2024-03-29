import React, { useEffect, useState, useCallback } from 'react';
import { View,Text,Button } from "react-native"
import { useValue } from "react-native-reanimated";
import { useRecoilState, useRecoilValue } from "recoil"
import { usersAtom, useUserActions, UNVERFIED_USER_ERROR_MESSAGE } from './useUserActions';
import {  usePersistentAtom } from '../state/userState';
import { authAtom } from './useFetchWrapper';
import { useFocusEffect } from "@react-navigation/native";

export function useLogin(navigation){
    const userActions = useUserActions()
    const [persistentState,setPersistentState,fetchPersistentState] = usePersistentAtom()
    const [loading,setLoading] = useState(false);
    const auth = useRecoilValue(authAtom)
    useEffect(()=>{

        const login  = (async ()=>{
            // console.log("Attempt login", persistentState,loading)
            if(persistentState.loaded && !loading){
                console.log({persistentState})
                if(persistentState.email === null || persistentState.password == null){
                    console.error("Navigating to email because persistent state info is null:",persistentState)
                    navigation.navigate("Login")
                }else{
                    const res = await userActions.login(persistentState.email,persistentState.password) 
                    if(res.err){
                        if(res.val == UNVERFIED_USER_ERROR_MESSAGE){
                            navigation.navigate("VerifyAccount")
                        }else{
                            if(persistentState?.alternativePasswords?.length>0){
                                // go through all the alternative passwords first
                                const [first,...rest] = persistentState.alternativePasswords
                                console.log({first,rest})
                                await setPersistentState({ 
                                    ...persistentState,
                                    password: first,
                                    alternativePasswords: rest,
                                    register:false,
                                })
                                return
                            }else{
                                await setPersistentState({
                                    ...persistentState,
                                    email: null,
                                    password: null,
                                    loaded: false,
                                    register: false
                                })
                                navigation.navigate("Login")
                            }
                        }
                    }
                }
            }else{
                // console.log("persistentState not loaded");
                if(!loading){
                    setLoading(true);
                    // console.log("Fetching persistent state")
                    await fetchPersistentState()
                    // console.log("Fetched Persistent state")
                    setLoading(false)
                }
            }
            // userActions.login("2021090@appleby.on.ca","goodpassword123") 
        })
        if(!auth && navigation.isFocused()){
            login()
        }
    },[persistentState,navigation.isFocused()]);
}