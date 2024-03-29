import React, { useEffect, useMemo, useRef, useState } from "react"
import { View, Text, Button, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ImageBackground, Touchable, Dimensions, Modal } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useRecoilValue, useRecoilState } from 'recoil';
import { setTextRange } from 'typescript';
import { authAtom } from '../../utils/session/useFetchWrapper';
import { useUserActions, ImageResult } from '../../utils/session/useUserActions';
import { MealState, getNameOfStation } from '../dashboard/typeUtil';
import { getTimeInfoOfNow, TimeInfo } from '../state';
import { useLogin } from "../../utils/session/session";
import { LoadingIcon } from "../../utils/Loading";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDesignScheme } from '../../design/designScheme';
import { colorOfCategory } from '../dashboard/NutritionFacts';
import { formatNumber } from '../../utils/math';
import * as ImagePicker from "expo-image-picker"
import tinyColor from 'tinycolor2'
import { useMealFeatures } from '../dashboard/useMealFeatures';
import { useSegmentScreen } from "../../utils/analytics/useSegmentScreen";
import { Camera } from 'expo-camera';
import * as Segment from "expo-analytics-segment"

const cameraSvg = `<svg width="27" height="22" viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.25 3.38611H8.75C8.96875 2.82361 9.5625 1.69861 10.1875 1.69861H17.3438C17.8687 1.69861 18.3958 2.82361 18.5938 3.38611H24.375C25.025 3.38611 25.8125 3.82361 25.8125 4.82361V18.7611C25.8125 19.8236 25.3125 20.2611 24.1875 20.2611H3.25C2.375 20.2611 1.625 19.7611 1.625 18.7611V4.82361C1.625 3.88611 2.05 3.38611 3.25 3.38611Z" stroke="#A4A4A4" stroke-width="2"/>
<rect x="4.3125" y="6.22986" width="1.90625" height="1.90625" fill="#A4A4A4"/>
<circle cx="13.6406" cy="11.7455" r="4.51562" stroke="#A4A4A4" stroke-width="2"/>
</svg>
`
const bgPicture = require("../../assets/bg.png")

export const IMAGE_ASPECT_RATIO = 1.4;

export const back_icon_svg = `<svg width="18" height="27" viewBox="0 0 18 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 2L4.10542 11.1192C2.53914 12.32 2.53914 14.68 4.10542 15.8808L16 25" stroke-width="4"/>
</svg>
`
export const NutritionInfoEntry = ({name, value, unit})=>{
    const ds = useDesignScheme()
    
    return   <View style = {{flexDirection: "row",alignItems:"center",marginVertical: 3}}>
                    <Text style = {{ color: ds.colors.grayscale1,fontFamily: ds.fontFamilies.medium,marginRight: 5, fontSize: 13}}>
                        {name}
                    </Text>
                    <View style = {{
                        backgroundColor: ds.colors.grayscale4,
                        minWidth: 60,
                        borderRadius: 5,
                        marginLeft: "auto",
                        padding: 5,
                    }}>

                        <Text style = {{ color: "#515151",marginLeft: "auto",fontSize: 12}}>
                            {isFinite(value) && `${formatNumber(value)}${unit}` }
                        </Text>
                    </View>
                </View>
}

const camera_button_icon= `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25.375" cy="25.375" r="23.625" stroke="#D9D9D9" stroke-width="2"/>
<g filter="url(#filter0_i_2007_334)">
<circle cx="25.375" cy="25.5391" r="19.2305" fill="white"/>
</g>
<circle cx="25.375" cy="25.5391" r="18.7305" stroke="white"/>
<defs>
<filter id="filter0_i_2007_334" x="6.14453" y="6.30859" width="38.4609" height="42.4609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2.5"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_2007_334"/>
</filter>
</defs>
</svg>
`
const media_library_icon = `<svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="12.5078" y="0.0625" width="25.375" height="33.125" rx="4" fill="white"/>
<line x1="8.00781" y1="4.625" x2="8.00781" y2="28.625" stroke="white" stroke-width="3" stroke-linecap="round"/>
<line x1="1.75781" y1="7.4375" x2="1.75781" y2="25.1875" stroke="white" stroke-width="3" stroke-linecap="round"/>
</svg>
`

const x_icon =  `<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 2.25L9.21875 9.46875M16.4375 16.6875L9.21875 9.46875M9.21875 9.46875L16.4375 2.25L2 16.6875" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
function IndividualItem(props){
    const userActions = useUserActions()
    const {width,height} = Dimensions.get("window")
    const inset = useSafeAreaInsets()
    const {navigation,route} = props
    const {timeInfo, itemId} : {timeInfo: TimeInfo, itemId: number}= route.params
    const {mealState,setDishUserGraphic} = useMealFeatures({timeInfo,onLoad: ()=>{},doFetchMeal: false})
    const item = useMemo(()=>{
        return mealState?.menu?.dishes?.filter((dish)=> dish.id == itemId)?.[0]
    },[mealState])
    const graphic = item?.graphic
    const foodName = item?.name
    const fontSize =   foodName?.length> 20? 20: 28
    const type = item?.category
    const station = item?.station
    const stationName = getNameOfStation(station)
    const calorieCount = item?.nutritionSummary?.calories
    const ds = useDesignScheme()
    const dish = item;

    useSegmentScreen(navigation,"IndividualItem",{ item:{foodName, id: itemId},station,timeInfo})

    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [showingCameraModal,setShowingCameraModal] = useState(false)
    const cameraRef = useRef(null as Camera);

    useEffect(() => {
        if(showingCameraModal){
            (async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasCameraPermission(status === 'granted');
            })();
        }
    }, [showingCameraModal]);
    async function submitImage(result:ImageResult ){
        const resp = await userActions.postItemImage(result,dish)
        setDishUserGraphic(itemId, result.uri)
        Segment.trackWithProperties("Submitted item image",{
            item:{foodName, id: itemId},station,timeInfo,
            // some unique code/ url from resp also
        })
    }
    async function useImagePicker(){
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [IMAGE_ASPECT_RATIO, 1],
            quality: 0.8,
        });
    
        console.log(result);
    
        if (result.cancelled === false) { 
        // setUserImage(result.uri);
            submitImage(result)
        }
        return result
    }
    // const [userImage,setUserImage] = useState(null as string)
    return <View style = {{backgroundColor: ds.colors.grayscale5}}>
        <View style = {{
            width: "100%",
            aspectRatio: IMAGE_ASPECT_RATIO,
        }}>
            <ImageBackground style = {{
                width: "100%",
                aspectRatio: IMAGE_ASPECT_RATIO,
                opacity: graphic? 1 : 0.5
                }} source = {graphic ? {uri:graphic.uri}: bgPicture} />
        </View>
        {
            // if there is no graphic or the graphic originates from the user, show the header
            ((!graphic) || graphic?.source == "user") && <View style = {{
                position: "absolute",
                top: 0,
                width: "100%", 
                height: 120,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                backgroundColor: tinyColor(ds.colors.grayscale5).setAlpha(graphic?.source == "user"? 0.95:  0.8).toRgbString(),
                padding: 30,
                paddingLeft: 60, 
                justifyContent: "center",
            }}>
                { 
                //If the source is the user, display the thanks message
                graphic?.source == "user"?
                <View style = {{height: "100%", justifyContent: "space-between"}}>
                    <Text style = {{color: ds.colors.grayscale3_4, fontSize: 18}}>
                        Your photo is pending review,
                    </Text>
                    <Text style = {{color: ds.colors.grayscale3_4, fontSize: 18}}>
                        Thank you for making WePlate better for everyone!
                    </Text>
                </View>

                // otherwise show the request for images
                :
                    <TouchableOpacity style = {{height: "100%", justifyContent: "space-between"}}
                        onPress = {async ()=>{
                            // await useImagePicker()
                            setShowingCameraModal(true)
                        }}
                    >
                        <Text style = {{color: ds.colors.grayscale3_4, fontSize: 18}}>
                            This item does not have an image yet,
                        </Text>
                        <View style = {{flexDirection: "row", width: "100%"}}>
                            <Text style = {{color: ds.colors.grayscale3_4, fontSize: 18}}>
                                Take a picture to help us out 
                            </Text>
                            <View style = {{ flex: 1, justifyContent : "center", alignItems: 'center'}}>

                                <SvgXml xml = {cameraSvg}/>
                            </View>
                        </View>
                    </TouchableOpacity>
                }
            </View>
        }
        <View style = {{
            position: 'absolute',
            top: 250,
            width: "100%",
            height: height-250,
            backgroundColor: ds.colors.grayscale5,
            borderRadius:20,

            padding: 30,
        }}>
             <Text style={{fontSize,fontFamily: ds.fontFamilies.black, color: colorOfCategory(type),marginRight:60}}>{foodName}</Text>
            {station ? <Text style={{color: ds.colors.grayscale3_4, fontSize: 18}}>{ stationName.length <= 2 ?"Station " : null}{stationName}<Text/><Text style={{color: ds.colors.grayscale3_4, fontWeight: '600'}}> | </Text>{formatNumber(calorieCount)} Calories</Text> 
            : <Text style={{color: ds.colors.grayscale3_4, fontSize: 18}}>{formatNumber(calorieCount)} Calories</Text> }

            <Text style = {{fontSize: 18,color: ds.colors.grayscale3_4,marginTop:20,marginBottom:5}}>
                Nutrition Facts
            </Text>
            <View style = {{flexDirection:"row", paddingRight: 0, paddingLeft: 0, }}>
                <View style = {{flexDirection: "column", flex: 1, paddingRight: 20,}}>
                    <NutritionInfoEntry name = "Total Fats" value = {dish.nutritionSummary.totalFat} unit = "g"/>
                    <NutritionInfoEntry name = "Saturated Fat" value = {dish.nutritionSummary.saturatedFat} unit = "g"/>
                    <NutritionInfoEntry name = "Sugar" value = {dish.nutrition.sugar} unit = "g"/>
                    <NutritionInfoEntry name = "Fiber" value = {dish.nutrition.dietaryFiber} unit = "g"/>
                    <NutritionInfoEntry name = "Potassium" value = {dish.nutrition.potassium} unit = "mg"/>
                    <NutritionInfoEntry name = "Iron" value = {dish.nutrition.iron} unit = "mg"/>
                </View>
                <View style = {{flexDirection: "column", flex: 1}}>
                    <NutritionInfoEntry name = "Proteins" value = {dish.nutritionSummary.protein} unit = "g"/>
                    <NutritionInfoEntry name = "Carbohydrates" value = {dish.nutritionSummary.carbohydrates} unit = "g"/>
                    <NutritionInfoEntry name = "Cholesterol" value = {dish.nutrition.cholesterol} unit = "mg"/>
                    <NutritionInfoEntry name = "Sodium" value = {dish.nutrition.sodium} unit = "mg"/>
                    <NutritionInfoEntry name = "Calcium" value = {dish.nutrition.calcium} unit = "mg"/>
                    <NutritionInfoEntry name = "Vitamin D" value = {dish.nutrition.vitaminD} unit = "IU"/>
                </View>
            </View>
        </View>
        <Modal transparent visible = {(!! showingCameraModal ) && hasCameraPermission} style = {{ alignItems: "center", justifyContent: "center"}}>
            <TouchableOpacity style = {{
                position: "absolute",
                width:"100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.3)",
                alignItems: 'stretch',
                // justifyContent: 'center'
            }}
            onPress = {()=>{
                setShowingCameraModal(false)
            }}
            />
            <View style = {{ width: "100%", alignItems: "center", flexDirection: "row"}}>
                <View style = {{
                    // width: "100%",
                    flex: 1,
                    margin: 30,
                    aspectRatio: 1,
                    backgroundColor: "black",
                    borderRadius: 20,
                    overflow: "hidden",
                    alignItems: "center",
                }}>

                    <Camera style = {{
                        width: "100%",
                        aspectRatio: IMAGE_ASPECT_RATIO,
                        borderRadius:  20,
                        overflow: "hidden"
                    }}
                    ratio = {"3:2"}
                    type = {Camera.Constants.Type.back}
                    ref = {cameraRef}
                    >

                    </Camera>
                    <View style = {{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        alignContent: "space-between",
                        width: "100%",
                    }}>
                        <TouchableOpacity style = {{
                            height: "100%",
                            aspectRatio: 1,
                            position: "absolute",
                            left: 0,
                            // backgroundColor: "orange",
                            alignItems: "center",
                            justifyContent: "center",
                        }} onPress = {async ()=>{
                            const res = await useImagePicker()
                            if(res.cancelled == false){
                                setShowingCameraModal(false)
                            }
                        }}>
                            <SvgXml xml = {media_library_icon}/>
                        </TouchableOpacity>
                        <TouchableOpacity style = {{
                            height: "100%",
                            aspectRatio: 1,
                            position: "absolute",
                            right: 0,
                            // backgroundColor: "orange",
                            alignItems: "center",
                            justifyContent: "center",
                        }} onPress = {()=>{
                           setShowingCameraModal(false) 
                        }}>
                            <SvgXml xml = {x_icon}/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress = {async ()=>{
                            // take picture,
                            if(cameraRef?.current !== null){
                                const photo = await cameraRef.current.takePictureAsync()
                                setShowingCameraModal(false)
                                await submitImage(photo)
                            }
                        }}>
                            <SvgXml xml={camera_button_icon}/>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        <TouchableOpacity style = {{
            position: 'absolute',
            top: inset.top+10,
            left: 20,
            width: "20%",
            height: "20%",
        }} onPress = {()=>{
            navigation.goBack()
            // .navigate("SidebarNavigable",{screen: "DiningMenu"})
        }}>
            <SvgXml xml = {back_icon_svg} stroke = {graphic?.source =="WePlate" ? ds.colors.grayscale5: ds.colors.grayscale2}/>
        </TouchableOpacity>
    </View>
}

export default IndividualItem