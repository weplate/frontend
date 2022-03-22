import { View, Text, Button, ScrollView, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SvgXml } from "react-native-svg"
import { useRecoilState, useRecoilValue } from "recoil";
import { STATION, getNameOfStation, convertAPIItemToDish, FOOD_CATEGORY, Dish } from '../dashboard/typeUtil';
import { diningMenuState } from './state';
import {useEffect, useState} from 'react';
import { dashboardStateAtom, dateToString, TimeInfo } from '../dashboard/state';
import { APIMealByTimeEvent, APIMealByTimePayload } from '../utils/session/apiTypes';
import { useUserActions } from '../utils/session/useUserActions';
import { authAtom } from '../utils/session/useFetchWrapper';
import { formatNumber } from '../utils/math';
import { LoadingIcon } from '../utils/Loading';
import { useLogin } from '../utils/session/session';
import { useDashboardState, useMealFeatures } from '../dashboard/Dashboard';

export const BASE_PORTION_FILL_FRACTION = 0.7

export const leaf_xml = `<svg width="60" height="39" viewBox="0 0 60 39" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="1" d="M23.5714 22.5714C22.7827 20.5256 21.9319 18.7338 21.0627 17.1739M13.0348 8.31129C14.6037 8.97479 17.9506 11.5884 21.0627 17.1739M21.0627 17.1739C25.0767 9.32987 19.5575 4.23696 16.0453 3.21838C12.5331 2.1998 7.01394 1.69051 3 2.1998C7.51568 9.32976 5.00697 12.3855 9.02091 16.4598C12.2321 19.7193 16.0453 20.1946 17.5505 20.0249"  stroke-width="3" stroke-linecap="round"/>
<path opacity="1" d="M26.1429 37.1428C27.2065 34.0972 28.4358 31.2432 29.7985 28.6191M46.3771 11.5719C43.1494 12.7716 40.0021 15.0079 37.0958 18.09M29.7985 28.6191C23.1078 18.5914 31.2014 7.05942 41.8244 6.05664C50.3227 5.25442 55.4825 5.38812 57 5.55525C49.4122 17.5886 51.4356 23.6053 47.3888 27.115C43.9201 30.1233 41.8244 31.6275 33.2249 30.6247M29.7985 28.6191C31.1561 26.0049 32.646 23.6188 34.2366 21.4989M37.0958 18.09C38.0459 14.8811 38.6206 12.7419 38.7893 12.0733M37.0958 18.09C36.1131 19.1321 35.158 20.2709 34.2366 21.4989M34.2366 21.4989C39.0928 19.9751 42.6675 20.597 43.8478 21.0983" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export const bread_xml = `<svg width="69" height="34" viewBox="0 0 69 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M34.5 2L46.831 2C57.581 2 65.4855 12.3125 66.434 18.875C67.3825 25.4375 68.6473 32 56.3163 32C46.4515 32 37.6618 32 34.5 32"  stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M34.5 2L22.169 2C11.419 2 3.51453 12.3125 2.566 18.875C1.61746 25.4375 0.352748 32 12.6837 32C22.5485 32 31.3382 32 34.5 32"  stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21.1904 2C19.8741 3.68972 16.5123 8.08303 13.596 12.1383C11.4695 15.0953 15.4186 21.1069 19.3678 16.0377C22.5271 11.9824 27.7723 4.98951 30 2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M36.1904 2C34.8741 3.68972 31.5123 8.08303 28.596 12.1383C26.4695 15.0953 30.4186 21.1069 34.3678 16.0377C37.5271 11.9824 42.7723 4.98951 45 2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M50.6087 3C49.2899 4.66528 46.5189 8.22646 43.5971 12.2231C41.4666 15.1374 45.4232 21.0619 49.3797 16.0661C52.5449 12.0694 54.7681 9.40494 57 6.45867" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
export const meat_xml = `<svg width="53" height="53" viewBox="0 0 53 53" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M23.927 4.50332C17.1246 11.7102 23.2184 21.2841 27.1156 25.1701C30.8356 28.8796 42.5271 35.7685 47.8414 30.9992M23.927 4.50332C30.8357 -2.38562 40.9328 6.62283 45.7157 11.3923C51.302 16.9628 53.1558 26.23 47.8414 30.9992M23.927 4.50332C14.8926 14.0417 15.4241 15.501 15.424 19.8708C15.424 26.1006 8.90498 31.4636 12.7667 36.7438M47.8414 30.9992C43.0587 34.7088 38.8069 39.4777 30.304 38.4179C23.8389 37.6121 22.5838 42.688 17.0182 40.0472M12.7667 36.7438C13.1753 37.3024 13.7001 37.8602 14.3611 38.4179C15.3518 39.1423 16.2284 39.6724 17.0182 40.0472M12.7667 36.7438L7.98382 40.5376C3.20092 35.7683 -1.58198 46.8966 5.85809 46.8966C5.32665 53.7855 17.5496 51.136 12.2353 45.3068L17.0182 40.0472" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="36.5649" cy="17.4382" rx="5.52339" ry="3.68226" transform="rotate(42.2057 36.5649 17.4382)" stroke-width="3"/>
</svg>
`
const NutritionInfoEntry = ({name, value, unit})=>{
    return   <View style = {{flexDirection: "row"}}>
                    <Text style = {{ color: "#747474"}}>
                        {name}
                    </Text>
                    <Text style = {{ color: "#515151", marginLeft: "auto"}}>
                        {isFinite(value) && `${formatNumber(value)}${unit}` }
                    </Text>
                </View>
}
const FoodItem = ({dish} :{dish: Dish}) => {
    const [open,setOpen] = useState(false)
    const foodName= dish.name
    const type= dish.category
    const calorieCount= dish.nutritionSummary.calories
    const station= dish.station
    const stationName = getNameOfStation(station);
    const fontSize =   foodName.length> 20? 18: 20
    // const fontSize =  foodName.length > 45? 10: foodName.length > 35 ? 12: foodName.length> 20? 15: 20
    return <View style = {{backgroundColor: '#D3D3D3', marginTop: 20, marginLeft: 20, marginRight:20, borderRadius: 12}}>
        <TouchableOpacity style={styles.foodItem} onPress = {()=>{setOpen(!open)}}>
            <View>
                <Text style={[styles.foodName,{fontSize,marginRight:60}]}>{foodName}</Text>
                {station ? <Text style={styles.calorieCount}>{ stationName.length <= 2 ?"Station " : null}{stationName}<Text/><Text style={{color: 'black', fontWeight: '600'}}> | </Text>{formatNumber(calorieCount)} Calories</Text> 
                : <Text style={styles.calorieCount}>{formatNumber(calorieCount)} Calories</Text> }
            </View>
            
            { type == FOOD_CATEGORY.Vegetable ?

                <SvgXml style={{marginLeft: 'auto'}} stroke = "#C0C0C0" xml={leaf_xml} height="100%"/> 
                
            : type == FOOD_CATEGORY.Carbohydrates ? 
                
                <SvgXml style={{marginLeft: 'auto'}} stroke = "#C0C0C0" xml={bread_xml} height="100%"/>
                
            :
                <SvgXml style={{marginLeft: 'auto'}} stroke = "#C0C0C0" xml={meat_xml} height="100%"/>
            }

        </TouchableOpacity>
        {open && <View style = {{flexDirection:"column"}}>
            {dish?.graphic && 
                <View style = {{width: "100%",padding:20}}>
                    <Image style = {{ flex:1,aspectRatio:1,borderRadius:20}} source = {{uri: dish.graphic}}/>
                </View>
            }
            <View style = {{flexDirection:"row", padding: 20, paddingLeft: 30 }}>
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
        </View>}
    </View>

};

const renderFood = ({ item}) => {
    return (
        <FoodItem 
            dish = {item}
            
        />
    );
}

const STATIONS = Object.keys(STATION)
const DiningMenu = ({navigation,route})=> {
    const auth = useRecoilValue(authAtom)
    useLogin(navigation)
    const userActions = useUserActions()

    // const [currentStation,setCurrentStation] = useState(STATION.A);
    const currentStation = route?.params?.station ?? STATION.A

    const {timeInfo} = useDashboardState()
    const {mealState,loading,noMeal,setMealDishes, isPast, isPresent, isFuture} = useMealFeatures({timeInfo,onLoad: ()=>{},doFetchMeal: false})
    // async function fetchMeals(){
    //     if(auth === null) return
    //     if(loading) return
    //     const data :APIMealByTimePayload = await userActions.mealsByTime(timeInfo)
    //     setLoading(true)
    //     if(data.length === 0){
    //         console.log("no data for today")
    //         setNoMealInfo({message:"No menu for today."})
    //         setLoading(false)
    //     }else{
    //         const mealID = data[0].id as number;
    //         const mealEvent = await userActions.mealById(mealID)
    //         const dishes = mealEvent.items.map(convertAPIItemToDish)
    //         console.log("Dishes Loaded,",dishes.length)
    //         setDiningState({
    //             dishes,
    //             timeInfo: timeInfo
    //         });
    //         setLoading(false)
    //     }
    // }

    // useEffect(()=>{
    //     if(diningState.dishes === null && !loading && noMealInfo == null){
    //         fetchMeals()
    //     }
    // },[auth,timeInfo])

    const [foods,setFoods] = useState([])
    useEffect(()=>{
        // console.log(currentStation)
        if(mealState?.menu?.dishes){
            
            const newFoods = mealState.menu.dishes
                                .filter(dish => dish.station === currentStation)
                                // .map( dish => {return {
                                //     foodName: dish.name,
                                //     type: dish.category,
                                //     station: dish.station,
                                //     calorieCount : dish.nutritionSummary.calories * BASE_PORTION_FILL_FRACTION
                                // }})
            console.log("Newfoods:",newFoods.length)
            setFoods(newFoods)
        }

    },[mealState,currentStation])


  
    return (
    
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? 
                <LoadingIcon/> 
            :noMeal? 
                <Text style = {{
                    fontSize:20, color : "#606060"
                }}>
                    {noMeal.message}    
                </Text> 
            :
            <FlatList 
                data = {foods}
                showsVerticalScrollIndicator={false}
                renderItem = {renderFood}
                contentContainerStyle={{ paddingBottom: 40 }}
                // keyExtractor={(item) => item.foodName}
                style={{width: '100%'}}    
            />
            }
            
        </View>

    )
    
}


export default DiningMenu

const styles = StyleSheet.create({

    foodItem: {

        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 0,

        // drop shadow for ios
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,  
        flexDirection: 'row',

        // drop shadow for android
        elevation: 5

    },

    foodName: {
        fontWeight: "700",
        fontSize: 20
    },

    calorieCount: {
        color: 'gray'
    }

})